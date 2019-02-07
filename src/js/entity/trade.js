import Util from 'util/util'
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
const TRADE_ROUTE_MIN_GOODS = 5

const canExport = (colony, good) => [EXPORT, HUB].includes(colony.trade[good])
const canImport = (colony, good) => [IMPORT, HUB].includes(colony.trade[good])

const canExportAmount = (colony, good) => colony.storage[good] + LoadCargo.forecast(colony, good)
const canImportAmount = (colony, good) => colony.capacity - colony.storage[good] + LoadCargo.forecast(colony, good)

const exportImportance = (colony, amount) => Math.max(amount / colony.capacity, 0)
const importImportance = (colony, amount) => Math.min(1 - (amount / colony.capacity), 0)

const distanceToSrc = (src, transport) =>
	PathFinder.distance(transport.mapCoordinates, src.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)
const distanceOfRoute = (src, dest, transport) =>
	PathFinder.distance(src.mapCoordinates, dest.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)


const match = transport => {
	// colonies in area
	const colonies = Record.getAll('colony').filter(colony => Colony.area(colony, transport.domain) === Unit.area(transport))
	const capacity = 100 * transport.properties.cargo
	const routes = Util.pairs(colonies, colonies)
		.map(pair => ({ src: pair.one, dest: pair.other }))
		.filter(pair => pair.one === pair.other)
		.map(route => {
			let slots = transport.properties.cargo

			// create orders
			const orders = goods(route.src.trade)
				.map(pack => pack.good)
				.filter(good => canExport(route.src, good) && canImport(route.dest, good))
				.map(good => {
					const exportAmount = canExportAmount(route.src, good)
					const importAmount = canImportAmount(route.dest, good)
					const amount = Math.floor(Math.min(exportAmount, importAmount, capacity))
					const importance = amount * (1 + exportImportance(route.src, exportAmount)) * (0.5 + importImportance(route.dest, importAmount))
					return {
						good,
						amount,
						importance,
					}
				})
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
				distance: distanceToSrc(route.src, transport) + distanceOfRoute(route.src, route.dest, transport),
				orders,
				amount: Util.sum(orders.map(order => order.amount)),
				importance: Util.sum(orders.map(order => order.importance))
			}
		})
		.filter(route => route.distance < TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed)
		.filter(route => route.amount >= TRADE_ROUTE_MIN_GOODS)

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
	HUB
}