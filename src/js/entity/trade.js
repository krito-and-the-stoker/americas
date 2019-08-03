import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Record from 'util/record'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Treasure from 'entity/treasure'
import Market from 'entity/market'
import Forecast from 'entity/forecast'


const NOTHING = 0
const IMPORT = 1
const EXPORT = 2
const BALANCE = 3
const BUY = 4
const SELL = 5

const create = () => Storage.create()
const save = trade => Storage.save(trade)
const load = data => Storage.load(data)
const listen = (trade, fn) => Storage.listen(trade, fn)
const update = (trade, pack) => Storage.update(trade, pack)
const goods = trade => Storage.goods(trade)


const TRADE_ROUTE_DISTANCE_CAP = 15
const TRADE_ROUTE_MIN_GOODS = 15

const TREASURE_TARGET = 5000
const TREASURE_MIN = 500

const canExport = (colony, good) => [EXPORT, BALANCE].includes(colony.trade[good]) && canExportAmount(colony, good) > 0
const canImport = (colony, good) => [IMPORT, BALANCE].includes(colony.trade[good]) && canImportAmount(colony, good) > 0
const canTrade = (colony, good) => [IMPORT, EXPORT, BALANCE, BUY, SELL].includes(colony.trade[good])
const canBuy = (europe, good) => europe.trade[good] === BUY
const canSell = (europe, good) => europe.trade[good] === SELL

const averageRelativeStorageFill = good => {
	const relevantColonies = 	Record.getAll('colony')
		.filter(colony => canTrade(colony, good))

	return Util.average(relevantColonies.map(colony => colony.storage[good] / colony.capacity))
}


const targetAmount = (colony, good) => ({
	[IMPORT]: colony.capacity,
	[EXPORT]: 0,
	[BALANCE]: colony.capacity * averageRelativeStorageFill(good)
}[colony.trade[good]])


const estimatedAmount = (colony, good) => colony.storage[good] + Forecast.get(colony, good)
const canExportAmount = (colony, good) => Util.clamp(estimatedAmount(colony, good) - targetAmount(colony, good), 0, colony.capacity)
const canImportAmount = (colony, good) => Util.clamp(targetAmount(colony, good) - estimatedAmount(colony, good), 0, colony.capacity)

// how much can we buy depends on treasure
const canBuyAmount = (europe, good) => Math.floor((Treasure.amount() - TREASURE_MIN) / Market.ask(good))

const exportPriority = (colony, good) => Math.max(colony.storage[good] / colony.capacity, 0)
const importPriority = (colony, good) => Math.max(1 - (colony.storage[good] / colony.capacity), 0)

// higher priority when have lots of money
const buyPriority = () => Math.max(Treasure.amount() / TREASURE_TARGET, 0)
// higher priority when low on money
const sellPriority = () => Math.max(1 - (Treasure.amount() - TREASURE_MIN) / TREASURE_TARGET, 0)



const distanceCurrentPositionToSrc = (src, transport) => {
	if (src.isEurope) {
		if (Europe.has.unit(transport)) {
			return 0
		}

		return PathFinder.distanceToEurope(transport.mapCoordinates)
	}

	return PathFinder.distance(transport.mapCoordinates, src.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)
}
const distanceSrcToDest = (src, dest, transport) => {
	if (src.isEurope) {
		return PathFinder.distanceToEurope(dest.mapCoordinates)
	}
	if (dest.isEurope) {
		return PathFinder.distanceToEurope(src.mapCoordinates)
	}

	return PathFinder.distance(src.mapCoordinates, dest.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)
}

const routeDistance = (src, dest, transport) =>
	distanceCurrentPositionToSrc(src, transport) + distanceSrcToDest(src, dest, transport)


const match = transport => {
	const europe = {
		trade: Europe.trade(),
		isEurope: true,
		name: 'London',
		type: 'europe'
	}

	// colonies in area
	const colonies = Record.getAll('colony').filter(colony => Colony.area(colony, transport.domain) === Unit.area(transport)).concat([europe])
	const capacity = 100 * transport.properties.cargo
	const routes = Util.pairs(colonies, colonies)
		.filter(pair => pair.one !== pair.other)
		.map(pair => ({ src: pair.one, dest: pair.other }))
		.map(route => {
			let slots = transport.properties.cargo

			// create orders
			const orders = goods(route.src.trade)
				.map(pack => pack.good)
				.filter(good => (canExport(route.src, good) || canBuy(route.src, good)) && (canImport(route.dest, good) || canSell(route.dest, good)))
				.map(good => {
					// calculate amount and importance
					const exportAmount = route.src.isEurope ? canBuyAmount(route.src, good) : canExportAmount(route.src, good)
					const importAmount = route.dest.isEurope ? exportAmount : canImportAmount(route.dest, good)
					const amount = Math.floor(Math.min(exportAmount, importAmount, capacity))
					const exPrio = route.src.isEurope ? buyPriority() : exportPriority(route.src, good)
					const imPrio = (good === 'food' ? 2 : 1) * (route.dest.isEurope ? sellPriority() : importPriority(route.dest, good))
					const importance = amount * (1 + exPrio) * (0.5 + imPrio)

					return {
						good,
						amount,
						importance,
					}
				})
				.filter(order => order.amount > 0 && order.importance > 0)
				// sort by importance descending
				.sort((a, b) => b.importance - a.importance)
				// load as much as possible
				.filter(order => {
					const needed = Math.ceil(order.amount / 100)
					if (slots >= needed) {
						slots -= needed
						return true
					}
					return false
				})

			return {
				...route,
				distance: routeDistance(route.src, route.dest, transport),
				orders,
				amount: Util.sum(orders.map(order => order.amount)),
				importance: Util.sum(orders.map(order => order.importance))
			}
		})
		.filter(route => route.distance < TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed)
		.filter(route => route.amount >= TRADE_ROUTE_MIN_GOODS)

	// console.log(routes)

	if (routes.length === 0) {
		return null
	}

	return Util.min(routes, route => -route.importance)
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
	BUY,
	SELL,
	BALANCE,
	TREASURE_MIN
}