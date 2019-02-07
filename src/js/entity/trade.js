import PathFinder from 'util/pathFinder'
import Record from 'util/record'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

import LoadCargo from 'command/loadCargo'


const NOTHING = 0
const IMPORT = 1
const EXPORT = 2
const HUB = 3

const create = () => Storage.create()
const save = trade => Storage.save(trade)
const load = data => Storage.load(data)
const listen = (trade, fn) => Storage.listen(trade, fn)
const update = (trade, pack) => Storage.update(trade, pack)
const goods = trade => Storage.goods(trade)

const TRADE_ROUTE_DISTANCE_CAP = 15

const calculateDemands = () => Record.getAll('colony').map(colony =>
	Storage.goods(colony.storage)
		.filter(({ good }) => colony.trade[good] === IMPORT)
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
		.filter(({ good }) => colony.trade[good] === EXPORT)
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



export default {
	create,
	match,
	load,
	save,
	listen,
	update,
	goods,
	NOTHING,
	IMPORT,
	EXPORT,
	HUB
}