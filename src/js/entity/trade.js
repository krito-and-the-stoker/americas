import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Record from 'util/record'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Unit from 'entity/unit'
import Tile from 'entity/tile'
import MapEntity from 'entity/map'

import LoadCargo from 'command/loadCargo'


const NOTHING = 0
const IMPORT = 1
const EXPORT = 2
const HUB = 3
const BUY = 4
const SELL = 5

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
const isHub = (colony, good) => colony.trade[good] === HUB

const canExportAmount = (colony, good) => Math.max(colony.storage[good] + LoadCargo.forecast(colony, good), 0)
const canImportAmount = (colony, good) => Math.max(colony.capacity - colony.storage[good] + LoadCargo.forecast(colony, good), 0)

const exportPriority = (colony, amount) => Math.max(amount / colony.capacity, 0)
const importPriority = (colony, amount) => Math.max(1 - (amount / colony.capacity), 0)

const areaPriority = (hub, area, good) => Record.getAll('colony')
	.filter(colony => colony !== hub)
	.filter(colony => Tile.radius(MapEntity.tile(colony.mapCoordinates)).map(tile => tile.area).includes(area))
	.filter(colony => canExport(colony, good) || canImport(colony, good))
	.filter(colony => !isHub(colony, good))
	.map(colony => ({
		export: canExport(colony, good) ? exportPriority(colony, canExportAmount(colony, good)) : 0,
		import: canImport(colony, good) ? importPriority(colony, canImportAmount(colony, good)) : 0,
	}))
	.reduce((sum, item) => ({
		export: sum.export + item.export,
		import: sum.import + item.import,
	}), { export: 0, import: 0 })


const distanceToSrc = (src, transport) =>
	PathFinder.distance(transport.mapCoordinates, src.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)
const distanceOfRoute = (src, dest, transport) =>
	PathFinder.distance(src.mapCoordinates, dest.mapCoordinates, transport, TRADE_ROUTE_DISTANCE_CAP*transport.properties.speed + 1)

const otherDomain = domain => domain === 'land' ? 'sea' : 'land'

const match = transport => {
	// colonies in area
	const colonies = Record.getAll('colony').filter(colony => Colony.area(colony, transport.domain) === Unit.area(transport))
	const capacity = 100 * transport.properties.cargo
	const routes = Util.pairs(colonies, colonies)
		.filter(pair => pair.one !== pair.other)
		.map(pair => ({ src: pair.one, dest: pair.other }))
		.map(route => {
			let slots = transport.properties.cargo

			// create orders
			const orders = goods(route.src.trade)
				.map(pack => pack.good)
				.filter(good => canExport(route.src, good) && canImport(route.dest, good))
				.map(good => {
					if (isHub(route.src, good) && isHub(route.dest, good)) {
						const srcArea = Colony.area(route.src, otherDomain(transport.domain))
						const destArea = Colony.area(route.dest, otherDomain(transport.domain))
						if (srcArea && destArea && srcArea !== destArea) {
							const srcPriority = areaPriority(route.src, srcArea, good)
							const destPriority = areaPriority(route.dest, destArea, good)
							const exportAmount = canExportAmount(route.src, good)
							const importAmount = canImportAmount(route.dest, good)
							const amount = Math.floor(Math.min(exportAmount, importAmount, capacity))
							const exportPriorityFinal = (srcPriority.export - srcPriority.import)
							const importPriorityFinal = (destPriority.import - destPriority.export)
							if (exportPriorityFinal > 0 && importPriorityFinal > 0) {
								const importance = amount * (1 + exportPriorityFinal) * (0.5 + importPriorityFinal)
								return {
									good,
									amount,
									importance
								}
							}
						}

						return null
					}

					const exportAmount = canExportAmount(route.src, good)
					const importAmount = canImportAmount(route.dest, good)
					const amount = Math.floor(Math.min(exportAmount, importAmount, capacity))
					const importance = amount * (1 + exportPriority(route.src, exportAmount)) * (0.5 + importPriority(route.dest, importAmount))
					return {
						good,
						amount,
						importance,
					}
				})
				// discard unfit orders from hub to hub
				.filter(order => !!order)
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
				distance: distanceToSrc(route.src, transport) + distanceOfRoute(route.src, route.dest, transport),
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
	HUB,
	BUY,
	SELL
}