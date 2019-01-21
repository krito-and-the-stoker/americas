import Commander from './commander'
import MapEntity from '../entity/map'
import Storage from '../entity/storage'
import Record from '../util/record'
import PathFinder from '../util/pathFinder'
import LoadCargo from '../command/loadCargo'
import MoveTo from '../command/moveTo'
import Message from '../view/ui/message'

const calculateDemands = () => Record.getAll('colony').map(colony =>
	Storage.goods(colony.storage)
		.filter(({ good }) => colony.trade[good] > 0)
		.filter(({ amount }) => amount < colony.capacity)
		.map(({ good, amount}) => ({ good, amount: amount + LoadCargo.forecast(colony, good) }))
		.map(({ good, amount}) => ({
			colony,
			good,
			amount: colony.capacity - amount,
			importance: 1 - amount / colony.capacity
		}))).flat()

const calculateSupply = () => Record.getAll('colony').map(colony =>
	Storage.goods(colony.storage)
		.filter(({ good }) => colony.trade[good] < 0)
		.filter(({ amount }) => amount > 0)
		.map(({ good, amount}) => ({ good, amount: amount + LoadCargo.forecast(colony,  good) }))
		.map(({ good, amount}) => ({
			colony,
			good,
			amount,
			importance: amount / colony.capacity
		}))).flat()

const match = transport => {
	const demands = calculateDemands()
	const supply = calculateSupply()
	const routes = demands.map(demand => 
		supply.filter(({ good }) => good === demand.good)
		.map(supply => ({
			good: supply.good,
			from: supply.colony,
			to: demand.colony,
			amount: Math.min(demand.amount, supply.amount),
			importance: 3*demand.importance + 2*supply.importance,
			distance:
				PathFinder.distance(transport.mapCoordinates, supply.colony.mapCoordinates, transport) +
				PathFinder.distance(supply.colony.mapCoordinates, demand.colony.mapCoordinates, transport)
		}))
		.filter(route => route.distance < 50)).flat()
	// console.log('demands', demands)
	// console.log('supply', supply)
	// console.log('routes', routes)
	const rate = route => route.importance / ( 5 + route.distance)
	const route = routes.reduce((best, route) => rate(best) > rate(route) ? best : route, { importance: 0, distance: 0 })
	return route.importance > 0 ? route : null
}

let reserved = []
const reserve = (colony, pack) => {
	reserved.push({ colony, ...pack })
}


const create = (transport, tradeCommanderParam = null) => {
	const tradeCommander = tradeCommanderParam || Commander.create()

	const init = () => {
		if (!Commander.isIdle(tradeCommander)) {
			return true
		}

		// cannot start trade route when loaded
		if (Storage.split(transport.storage).length > 0) {
			return false
		}

		if (!transport.properties.cargo) {
			return false
		}

		// try unloading all passengers
		if (transport.passengers.length > 0) {
			if (MapEntity.tile(transport.mapCoordinates).domain === 'land') {
				Unit.unloadAll(transport)
				return true
			}
			return false
		}

		return true
	}

	const update = () => {
		if (Commander.isIdle(tradeCommander) && !tradeRoute.pleaseStop) {
			const route = match(transport)
			if (!route) {
				Message.send(`A ${transport.name} has not found any routes and stopped trading`)
				return false
			}
			console.log('new route', route)
			Commander.scheduleBehind(tradeCommander, MoveTo.create(transport, route.from.mapCoordinates))
			Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.from, transport, { good: route.good, amount: route.amount }))
			Commander.scheduleBehind(tradeCommander, MoveTo.create(transport, route.to.mapCoordinates))
			Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.to, transport, { good: route.good, amount: -route.amount }))
		}
		if (tradeRoute.pleaseStop) {
			Commander.clearSchedule(tradeCommander)
		}
		return tradeCommander.update()
	}

	const save = () => ({
		type: 'tradeRoute',
		tradeCommander: tradeCommander.save(),
		transport: Record.reference(transport)
	})

	const tradeRoute = {		
		init,
		update,
		save
	}

	return tradeRoute
}

const load = data => {
	const transport = Record.dereference(data.transport)
	const tradeRoute = create(transport, Commander.load(data.tradeCommander))

	return tradeRoute
}

export default { create, load }