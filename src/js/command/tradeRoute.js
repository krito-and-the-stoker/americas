import Message from 'util/message'
import Record from 'util/record'
import PathFinder from 'util/pathFinder'

import MapEntity from 'entity/map'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

import Commander from 'command/commander'
import LoadCargo from 'command/loadCargo'
import MoveTo from 'command/moveTo'


const TRADE_ROUTE_DISTANCE_CAP = 15

const calculateDemands = () => Record.getAll('colony').map(colony =>
	Storage.goods(colony.storage)
		.filter(({ good }) => colony.trade[good] > 0)
		.filter(({ amount }) => amount < colony.capacity)
		.map(({ good, amount}) => ({ good, amount: amount + LoadCargo.forecast(colony, good) }))
		.map(({ good, amount}) => ({
			colony,
			good,
			amount: good === 'food' ? 100 - amount : colony.capacity - amount,
			importance: good === 'food' ? 2*(1 - amount / 100) : 1 - amount / colony.capacity
		}))).flat()

const calculateSupply = () => Record.getAll('colony').map(colony =>
	Storage.goods(colony.storage)
		.filter(({ good }) => colony.trade[good] < 0)
		.filter(({ amount }) => amount > 0)
		.map(({ good, amount }) => ({ good, amount: amount + LoadCargo.forecast(colony, good) }))
		.map(({ good, amount}) => ({
			colony,
			good,
			amount: good === 'food' ? amount - 20 : amount,
			importance: good === 'food' ? amount / 220 : amount / colony.capacity
		}))).flat()

const match = transport => {
	const demands = calculateDemands().filter(demand => transport.domain === 'land' || Colony.isCoastal(demand.colony))
	const supply = calculateSupply().filter(supply => transport.domain === 'land' || Colony.isCoastal(supply.colony))
	const routes = demands.map(demand => 
		supply
			.filter(({ good }) => good === demand.good)
			.filter(({ colony }) =>
				Colony.area(colony, transport.domain) === Colony.area(demand.colony, transport.domain) && 
				Colony.area(colony, transport.domain) === Unit.area(transport))
			.map(supply => ({
				good: supply.good,
				from: supply.colony,
				to: demand.colony,
				amount: Math.min(100*transport.properties.cargo, Math.floor(Math.min(demand.amount, supply.amount))),
				importance: (0.5 + demand.importance) * (0.5 + supply.importance),
				distance:
					PathFinder.distance(transport.mapCoordinates, supply.colony.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1) +
					PathFinder.distance(supply.colony.mapCoordinates, demand.colony.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)
			}))
			.filter(route => route.distance < TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed)
			.filter(route => route.amount >= 5)).flat()
	// console.log('demands', demands)
	// console.log('supply', supply)
	// console.log('routes', routes)
	const rate = route => route.amount * route.importance / (1 + route.distance)
	const route = routes.reduce((best, route) => rate(best) > rate(route) ? best : route, { importance: 0, distance: 0 })
	// console.log('best', route)
	return route.importance > 0 ? route : null
}


const create = (transport, tradeCommanderParam = null, initialized = false, waitingForRoute = 0) => {
	const tradeCommander = tradeCommanderParam || Commander.create({ keep: true })

	const init = () => {
		if (initialized) {
			return true
		}
		initialized = true

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

	const update = currentTime => {
		if (Commander.isIdle(tradeCommander) && !tradeRoute.pleaseStop && currentTime > waitingForRoute) {
			const route = match(transport)
			if (route) {
				Commander.scheduleBehind(tradeCommander, MoveTo.create(transport, route.from.mapCoordinates))
				Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.from, transport, { good: route.good, amount: route.amount }))
				Commander.scheduleBehind(tradeCommander, MoveTo.create(transport, route.to.mapCoordinates))
				Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.to, transport, { good: route.good, amount: -route.amount }))
			} else {
				Message.send(`A ${transport.name} has not found any routes and will look again shortly`)
				waitingForRoute = currentTime + 2500
			}
		}
		if (tradeRoute.pleaseStop) {
			Commander.clearSchedule(tradeCommander)
			tradeCommander.update()
			return !Commander.isIdle(tradeCommander)
		}
		return tradeCommander.update()
	}

	const save = () => ({
		type: 'tradeRoute',
		waitingForRoute,
		initialized,
		tradeCommander: tradeCommander.save(),
		transport: Record.reference(transport)
	})

	const tradeRoute = {
		commands: tradeCommander.commands,
		init,
		update,
		save
	}

	return tradeRoute
}

const load = data => {
	const transport = Record.dereference(data.transport)
	const tradeRoute = create(transport, Commander.load(data.tradeCommander), data.initialized, data.waitingForRoute)

	return tradeRoute
}

export default { create, load }