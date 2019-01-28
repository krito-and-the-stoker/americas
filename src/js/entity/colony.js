import Goods from 'data/goods.json'
import Buildings from 'data/buildings.json'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Harvest from 'task/harvest'
import Time from 'timeline/time'
import Util from 'util/util'
import Colonist from 'entity/colonist'
import Record from 'util/record'
import Unit from 'entity/unit'
import Binding from 'util/binding'
import Storage from 'entity/storage'
import Consume from 'task/consume'
import Deteriorate from 'task/deteriorate'
import GrowHorses from 'task/growHorses'
import Member from 'util/member'
import Produce from 'task/produce'
import ColonyProduction from 'task/colonyProduction'
import ProductionSummary from 'task/productionSummary'
import Building from 'entity/building'
import ShrinkFromStarvation from 'action/shrinkFromStarvation'
import Message from 'view/ui/message'
import UnjoinColony from 'action/unjoinColony'
import LeaveColony from 'action/leaveColony'
import Notification from 'view/ui/notification'


// for unknown reasons we need to wait bit until we can set the global here :/
setTimeout(() => Record.setGlobal('colonyNames',
	['Jamestown',
	'Roanoke',
	'Virginia',
	"Cuper's Cove",
	"St. John's",
	'Henricus',
	'Delaware',
	'Pennsylvania',
	'Massachusetts Bay Colony',
	'Maine',
	'New Jersey',
	'Connecticut',
	'Maryland',
	'South Carolina',
	'New Hampshire',
	'North Carolina',
	'Rhode Island']), 0)

const getColonyName = () => {
	let colonyNames = Record.getGlobal('colonyNames')
	const name = colonyNames.shift()
	Record.setGlobal('colonyNames', colonyNames)
	return name
}

const isCoastal = colony => {
	const center = MapEntity.tile(colony.mapCoordinates)
	return Tile.radius(center).some(tile => tile.domain === 'sea')
}

const defender = colony => {
	const strength = colony.units
		.filter(unit => unit.domain === 'land')
		.reduce((strength, unit) => Math.max(strength, Unit.strength(unit)), 0)

	return Util.choose(colony.units
		.filter(unit => unit.domain === 'land')
		.filter(unit => Unit.strength(unit) === strength))
}

const add = {
	unit: (colony, unit) => Member.add(colony, 'units', unit),
	colonist: (colony, colonist) => Member.add(colony, 'colonists', colonist)
}

const remove = {
	unit: unit => Member.remove(unit.colony, 'units', unit),
	colonist: colonist => Member.remove(colonist.colony, 'colonists', colonist)
}

const listen = {
	units: (colony, fn) => Binding.listen(colony, 'units', fn),
	colonists: (colony, fn) => Binding.listen(colony, 'colonists', fn),
	construction: (colony, fn) => Binding.listen(colony, 'construction', fn),
	bells: (colony, fn) => Binding.listen(colony, 'bells', fn),
	buildings: (colony, fn) => Binding.listen(colony, 'buildings', fn),
	productionBonus: (colony, fn) => Binding.listen(colony, 'productionBonus', fn),
}

const listenEach = {
	units: (colony, fn) => Member.listenEach(colony, 'units', fn)
}

const update = {
	construction: (colony, value) => Binding.update(colony, 'construction', value),
	buildings: (colony, value) => Binding.update(colony, 'buildings', value),
	bells: (colony, value) => Binding.update(colony, 'bells', colony.bells + value),
	productionBonus: (colony, value) => Binding.update(colony, 'productionBonus', value),
}

const area = (colony, domain) =>
	Tile.radius(MapEntity.tile(colony.mapCoordinates))
		.filter(tile => tile.domain === domain)
		.map(tile => tile.area)
		.find(tile => true)

const tories = colony => {
	const colonists = colony.colonists.length
	const percentage = 100 - Math.min(100, Math.round(colony.bells / (colonists + 1)))
	const number = Math.round(colonists * percentage / 100)

	return {
		percentage,
		number
	}
}

const rebels = colony => {
	const tt = tories(colony)
	return {
		percentage: 100 - tt.percentage,
		number: colony.colonists.length - tt.number
	}
}

const expertLevel = {	
	farmer: 1,
	fisher: 1,
	sugarplanter: 1,
	tobaccoplanter: 1,
	cottonplanter: 1,
	furtrapper: 1,
	lumberjack: 1,
	oreminer: 1,
	silverminer: 1,
	distiller: 2,
	tobacconist: 2,
	weaver: 2,
	furtrader: 2,
	blacksmith: 2,
	gunsmith: 2,
	carpenter: 2,
	statesman: 3,
	preacher: 3,
}
const canTeach = (colony, expert) => expert && expertLevel[expert] && expertLevel[expert] <= colony.buildings.school.level
const canEmploy = (colony, building, expert) => colony.colonists
	.filter(colonist => colonist.work && colonist.work.building === building).length < Building.workspace(colony, building) &&
	(building !== 'school' || canTeach(colony, expert))


const initialize = colony => {
	colony.productionSummary = Storage.createWithProduction()
	colony.productionRecord = Storage.createWithProduction()
	const tile = MapEntity.tile(colony.mapCoordinates)
	const destroy = []
	destroy.push(Tile.listen.tile(tile, () =>
		Util.mergeFunctions(Tile.colonyProductionGoods(tile).map(good =>
			Time.schedule(Harvest.create(colony, tile, good))))))
	destroy.push(listen.colonists(colony, colonists => Time.schedule(Consume.create(colony, 'food', 2 * colonists.length))))
	destroy.push(listenEach.units(colony, (unit, added) => {
		if (added && unit.treasure) {
				Notification.create({ type: 'treasure', colony, unit })
			}
		}))

	let starvationMessageSent = false
	const needsToSendEmptyWarning = Util.makeObject(Goods.types.map(good => [good, false]))
	const needsToSendFullWarning = Util.makeObject(Goods.types.map(good => [good, false]))
	destroy.push(Storage.listen(colony.storage, storage => {
		const keepFood = 20
		if (storage.food >= 200 + keepFood) {
			const unit = Unit.create('settler', colony.mapCoordinates, colony.owner)
			Storage.update(colony.storage, { good: 'food', amount: -200 })
			Notification.create({ type: 'born', colony, unit })
		}
		if (storage.food < -1 && !starvationMessageSent) {
			Message.send(`The food storage of ${colony.name} is empty. We need to get food quickly to prevent losses amongst the colonists`)
			Notification.create({ type: 'starving', colony })
			starvationMessageSent = true
		}
		if (storage.food < -5) {
			Message.send(`A colonist in ${colony.name} died due to inadequate food supplies`)
			ShrinkFromStarvation(colony)
			storage.food = 0
			starvationMessageSent = false
		}
		// Goods.types
		// 	.filter(good => storage[good] >= 1)
		// 	.filter(good => good !== 'food')
		// 	.forEach(good => {
		// 		needsToSendEmptyWarning[good] = true
		// 	})
		// Goods.types
		// 	.filter(good => storage[good] <= 0)
		// 	.filter(good => colony.trade[good] >= 0)
		// 	.filter(good => good !== 'food')
		// 	.filter(good => needsToSendEmptyWarning[good])
		// 	.forEach(good => {
		// 		Notification.create({ type: 'storageEmpty', colony, good})
		// 		needsToSendEmptyWarning[good] = false
		// 	})
		// Goods.types
		// 	.filter(good => storage[good] < colony.capacity)
		// 	.filter(good => good !== 'food')
		// 	.forEach(good => {
		// 		needsToSendFullWarning[good] = true
		// 	})
		// Goods.types
		// 	.filter(good => storage[good] > colony.capacity)
		// 	.filter(good => good !== 'food')
		// 	.filter(good => needsToSendFullWarning[good])
		// 	.forEach(good => {
		// 		Notification.create({ type: 'storageFull', colony, good })
		// 		needsToSendFullWarning[good] = false
		// 	})
	}))
	colony.construction = {
		amount: colony.construction.amount,
		...Building.constructionOptions(colony).find(option => option.target === colony.construction.target) || Building.noProductionOption()
	}
	destroy.push(listen.construction(colony, construction => {
		if (construction.amount >= construction.cost.construction) {
			if (construction.cost.tools) {
				if (colony.storage.tools >= construction.cost.tools) {
					Building.construct(colony, construction)
				}
			} else {
				Building.construct(colony, construction)
			}
		}
	}))
	destroy.push(Time.schedule(ColonyProduction.create(colony)))
	destroy.push(Time.schedule(Deteriorate.create(colony)))
	destroy.push(Time.schedule(ProductionSummary.create(colony)))
	destroy.push(Time.schedule(GrowHorses.create(colony)))
	destroy.push(listen.colonists(colony, () => listen.bells(colony, () => {
		let bonus = 0
		if (tories(colony).number > 14) {
			bonus -= 1
		}
		if (tories(colony).number > 9) {
			bonus -= 1
		}
		if (rebels(colony).percentage >= 50) {
			bonus += 1
		}
		if (rebels(colony).percentage >= 100) {
			bonus += 1
		}
		if (colony.productionBonus !== bonus) {
			update.productionBonus(colony, bonus)
		}
	})))

	colony.destroy = Util.mergeFunctions(destroy)
}

const create = (coords, owner) => {
	const colony = {
		name: getColonyName(),
		owner,
		units: [],
		colonists: [],
		buildings: Building.create(),
		capacity: 100,
		mapCoordinates: { ...coords },
		construction: {
			amount: 0,
			target: "wagontrain",
		},
		bells: 0
	}
	colony.storage = Storage.create()
	colony.trade = Storage.create()

	// TODO: does the tile need to know about the colony?
	const tile = MapEntity.tile(coords)
	Tile.update.colony(tile, colony)

	listen.units(colony, console.log)

	initialize(colony)

	Record.add('colony', colony)
	return colony
}

const disband = colony => {
	console.log('disbanding', colony)
	colony.disbanded = true
	colony.colonists.forEach(UnjoinColony)
	colony.units.forEach(LeaveColony)
	const tile = MapEntity.tile(colony.mapCoordinates)
	Tile.update.colony(tile, null)
	Tile.removeRoad(tile)
	colony.destroy()
	tile.harvestedBy = null

	Record.remove(colony)
}

const save = colony => ({
	name: colony.name,
	units: colony.units.map(unit => Record.reference(unit)),
	colonists: colony.colonists.map(colonist => Record.reference(colonist)),
	capacity: colony.capacity,
	mapCoordinates: colony.mapCoordinates,
	storage: Storage.save(colony.storage),
	trade: Storage.save(colony.trade),
	buildings: colony.buildings,
	construction: colony.construction,
	bells: colony.bells,
	owner: Record.reference(colony.owner)
})

const load = colony => {
	const tile = MapEntity.tile(colony.mapCoordinates)
	tile.colony = colony
	colony.storage = Storage.load(colony.storage)
	colony.trade = colony.trade ? Storage.load(colony.trade) : Storage.create()
	colony.owner = Record.dereference(colony.owner)

	colony.colonists.forEach((colonist, index) => Record.dereferenceLazy(colonist, entity => colony.colonists[index] = entity))
	colony.units.forEach((unit, index) => Record.dereferenceLazy(unit, entity => colony.units[index] = entity))
	Record.entitiesLoaded(() => initialize(colony))

	return colony	
}

const coastalDirection = colony => {
	const center = MapEntity.tile(colony.mapCoordinates)
	const winner = Tile.diagonalNeighbors(center)
		.filter(neighbor => neighbor.coast)
		.map(neighbor => ({
			score: Tile.diagonalNeighbors(neighbor).filter(nn => nn.coast && Tile.diagonalNeighbors(center).includes(nn)).length + 1,
			tile: neighbor
		}))
		.reduce((winner, { tile, score }) => winner.score > score ? winner : { tile, score }, { score: 0 })

	return winner.score > 0 ? Tile.neighborString(center, winner.tile) : null
}

export default {
	create,
	save,
	load,
	area,
	coastalDirection,
	isCoastal,
	canEmploy,
	add,
	remove,
	listen,
	listenEach,
	update,
	tories,
	rebels,
	disband,
	expertLevel,
	defender
}