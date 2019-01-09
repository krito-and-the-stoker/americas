import Units from '../data/units.json'
import UnitView from '../view/unit'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Record from '../util/record'
import Commander from '../command/commander'
import Time from '../timeline/time'
import Colony from '../entity/colony'
import Storage from '../entity/storage'
import Util from '../util/util'
import Binding from '../util/binding'

let allUnits = []
const create = (name, coords = null, additionalProps = {}) => {
	if (Units[name]) {
		if (coords) {
			const tile = MapEntity.tile(coords)
			Tile.discover(tile)
			Tile.diagonalNeighbors(tile).forEach(other => Tile.discover(other))
		}

		const unit = {
			name,
			properties: Units[name],
			domain: Units[name].domain,
			mapCoordinates: coords || { x: undefined, y: undefined },
			active: true,
			cargo: [],
			expert: null,
			...additionalProps
		}
		unit.storage = Storage.create(unit)
		unit.equipment = Storage.create(unit)

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

		if (coords && MapEntity.tile(coords).colony) {
			Colony.enter(MapEntity.tile(coords).colony, unit)
		}
		unit.sprite = UnitView.createSprite(unit)

		Record.add('unit', unit)
		allUnits.push(unit)

		return unit
	} else {
		console.warn('unit type not found', name)
		return null
	}
}

const initialize = unit => {
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

const updateType = (unit, name) => {
	unit.name = name
	unit.properties = Units[name]
	UnitView.updateType(unit)
}
const at = coords => allUnits.filter(unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)
const hasStorageCapacity = unit => Storage.split(unit.storage).length + unit.cargo.length < unit.properties.cargo
const loadGoods = (unit, good, amount) => {
	if (!hasStorageCapacity(unit) && amount > 0) {
		return false
	}

	Storage.update(unit, good, amount)
	return true
}
const listenStorage = (unit, fn) => {
	return Storage.listen(unit, fn)
}

const loadUnit = (unit, cargoUnit) => {
	if (!hasStorageCapacity(unit)) {
		return false
	}

	UnitView.deactivate(cargoUnit)
	unit.cargo.push(cargoUnit)
	return true
}

const unloadUnit = unit => {
	if (unit.cargo.length > 0) {	
		const landingUnit = unit.cargo.shift()
		landingUnit.mapCoordinates = { ...unit.mapCoordinates }
		UnitView.activate(landingUnit)
		if (unit.colony) {
			Colony.enter(unit.colony, landingUnit)
		}

		return landingUnit
	}
	console.warn('could not unload, no units on board', unit)
	return null
}

const unloadAllUnits = unit => {
	Util.range(unit.cargo.length).forEach(() => unloadUnit(unit))
}

const save = unit => ({
	name: unit.name,
	properties: unit.properties,
	domain: unit.domain,
	active: unit.active,
	mapCoordinates: unit.mapCoordinates,
	expert: unit.expert,
	storage: unit.storage,
	equipment: unit.equipment,
	commander: unit.commander.save(),
	colony: Record.reference(unit.colony),
	colonist: Record.reference(unit.colonist),
	cargo: unit.cargo.map(other => Record.reference(other)),
})

const load = unit => {
	unit.cargo = unit.cargo.map(Record.dereference)
	unit.sprite = UnitView.createSprite(unit)
	Record.dereferenceLazy(unit.colony, colony => unit.colony = colony)
	Record.dereferenceLazy(unit.colonist, colonist => unit.colonist = colonist)
	Record.entitiesLoaded(() => {
		initialize(unit)
	})

	allUnits.push(unit)
	return unit
}

const reset = () => allUnits = []

export default {
	create,
	loadGoods,
	loadUnit,
	unloadUnit,
	unloadAllUnits,
	listenStorage,
	save,
	load,
	reset,
	at
}