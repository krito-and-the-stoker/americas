import Units from '../data/units.json'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Record from '../util/record'
import Commander from '../command/commander'
import Time from '../timeline/time'
import Colony from '../entity/colony'
import Storage from '../entity/storage'
import Util from '../util/util'
import Binding from '../util/binding'
import EnterColony from '../action/enterColony'

const create = (name, coords) => {
	if (Units[name]) {
		const unit = {
			name,
			properties: Units[name],
			domain: Units[name].domain,
			mapCoordinates: coords || { x: undefined, y: undefined },
			passengers: [],
			vehicle: null,
			colony: null,
			expert: null,
			offTheMap: false,
		}
		unit.storage = Storage.create()
		unit.equipment = Storage.create()

		if (name === 'pioneer') {
			unit.equipment.tools = 100
		}
		if (name === 'soldier') {
			unit.equipment.guns = 50
		}
		if (name === 'scout') {
			unit.equipment.horses = 50
		}
		if (name === 'dragoon') {
			unit.equipment.horses = 50
			unit.equipment.guns = 50
		}

		initialize(unit)

		const colony = MapEntity.tile(coords).colony
		if (colony) {
			EnterColony(colony, unit)
		}

		Record.add('unit', unit)

		return unit
	} else {
		console.warn('unit type not found', name)
		return null
	}
}

const initialize = unit => {
	const tile = MapEntity.tile(unit.mapCoordinates)
	Tile.discover(tile)
	Tile.diagonalNeighbors(tile).forEach(other => Tile.discover(other))

	unit.commander = Commander.create({ keep: true })
	Time.schedule(unit.commander)
	Binding.listen(unit, 'equipment', equipment => {
		// lose status
		if (unit.name === 'pioneer' && equipment.tools < 20) {
			updateType(unit, 'settler')
		}
		if (unit.name === 'scout' && equipment.horses < 50) {
			updateType(unit, 'settler')
		}
		if (unit.name === 'dragoon' && equipment.horses <= 0) {
			updateType(unit, 'soldier')
		}
		if (unit.name === 'soldier' && equipment.guns <= 0) {
			updateType(unit, 'settler')
		}

		// gain status
		if (unit.name === 'settler') {
			if (equipment.tools >= 20) {
				updateType(unit, 'pioneer')
			}
			if (equipment.guns > 0) {
				if (equipment.horses > 0) {
					updateType(unit, 'dragoon')
				} else {
					updateType(unit, 'soldier')
				}
			}
			if (equipment.horses >= 50) {
				updateType(unit, 'scout')
			}
		}
	})
}

const listen = {
	vehicle: (unit, fn) => Binding.listen(unit, 'vehicle', fn),
	offTheMap: (unit, fn) => Binding.listen(unit, 'offTheMap', fn)
}

const update = {
	vehicle: (unit, value) => Binding.update(unit, 'vehicle', value),
	offTheMap: (unit, value) => Binding.update(unit, 'offTheMap', value)
}

const updateType = (unit, name) => {
	unit.name = name
	unit.properties = Units[name]
}

const at = coords => Record.getAll('unit').filter(unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)
const hasCapacity = (unit, pack) => Storage.split(unit.storage)
	.filter(p => p.good === pack.good && (p.amount + pack.amount <= 100))
		.length + unit.passengers.length < unit.properties.cargo

const loadGoods = (unit, pack) => {
	if (!hasCapacity(unit, pack) && amount > 0) {
		return false
	}

	Storage.update(unit.storage, pack)
	return true
}

const loadUnit = (unit, passenger) => {
	if (!hasCapacity(unit)) {
		return false
	}

	update.vehicle(passenger, unit)
	unit.passengers.push(passenger)
	return true
}

const unloadUnit = unit => {
	if (unit.passengers.length > 0) {	
		const passenger = unit.passengers.shift()
		passenger.mapCoordinates = { ...unit.mapCoordinates }
		update.vehicle(passenger, null)
		if (unit.colony) {
			EnterColony(unit.colony, passenger)
		}

		return passenger
	}
	console.warn('could not unload, no units on board', unit)
	return null
}

const unloadAllUnits = unit => {
	// do not iterate over the cargo array directly because unloadUnit changes it
	Util.range(unit.passengers.length).forEach(() => unloadUnit(unit))
}

const save = unit => ({
	name: unit.name,
	properties: unit.properties,
	domain: unit.domain,
	mapCoordinates: unit.mapCoordinates,
	expert: unit.expert,
	storage: unit.storage,
	equipment: unit.equipment,
	offTheMap: unit.offTheMap,
	commander: unit.commander.save(),
	colony: Record.reference(unit.colony),
	colonist: Record.reference(unit.colonist),
	passengers: unit.passengers.map(other => Record.reference(other)),
	vehicle: Record.reference(unit.vehicle),
})

const load = unit => {
	unit.passengers = unit.passengers.map(Record.dereference)
	Record.dereferenceLazy(unit.colony, colony => unit.colony = colony)
	Record.dereferenceLazy(unit.colonist, colonist => unit.colonist = colonist)
	Record.dereferenceLazy(unit.vehicle, vehicle => unit.vehicle = vehicle)
	Record.entitiesLoaded(() => {
		initialize(unit)
	})

	return unit
}

export default {
	create,
	listen,
	update,
	loadGoods,
	loadUnit,
	unloadUnit,
	unloadAllUnits,
	save,
	load,
	at
}