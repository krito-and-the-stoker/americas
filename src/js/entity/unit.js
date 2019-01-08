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
			...Units[name],
			mapCoordinates: coords,
			active: true,
			cargo: [],
			goods: [],
			expert: null,
			...additionalProps
		}
		unit.storage = Storage.create(unit)
		unit.commander = Commander.create({ keep: true })
		Time.schedule(unit.commander)

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

const at = coords => allUnits.filter(unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)
const loadGoods = (unit, good, amount) => Storage.update(unit, good, amount)
const listenStorage = (unit, fn) => {
	return Storage.listen(unit, fn)
}

const loadUnit = (unit, cargoUnit) => {
	UnitView.deactivate(cargoUnit)
	unit.cargo.push(cargoUnit)
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
	...unit,
	commander: unit.commander.save(),
	sprite: undefined,
	colony: Record.reference(unit.colony),
	[Storage.LISTENER_KEY]: undefined,
	cargo: unit.cargo.map(other => Record.reference(other)),
})

const load = unit => {
	Storage.init(unit)
	unit.cargo = unit.cargo.map(Record.dereference)
	unit.sprite = UnitView.createSprite(unit)
	Record.dereferenceLazy(unit.colony, colony => unit.colony = colony)
	Record.entitiesLoaded(() => {	
		unit.commander = Commander.load(unit.commander)
		Time.schedule(unit.commander)
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