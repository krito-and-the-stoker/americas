import Units from '../data/units.json'
import UnitView from '../view/unit'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Record from '../util/record'
import Commander from '../command/commander'
import Time from '../timeline/time'
import Colony from '../entity/colony'
import Storage from '../entity/storage'

const create = (name, x, y, additionalProps = {}) => {
	if (Units[name]) {
		const tile = MapEntity.tile({ x, y })
		Tile.discover(tile)
		Tile.diagonalNeighbors(tile).forEach(other => Tile.discover(other))

		const unit = {
			name,
			...Units[name],
			mapCoordinates: { x, y },
			active: true,
			cargo: [],
			goods: [],
			expert: null,
			...additionalProps
		}
		unit.storage = Storage.create(unit)
		unit.commander = Commander.create({ keep: true })
		Time.schedule(unit.commander)

		if (tile.colony) {
			Colony.enter(tile.colony, unit)
		}
		unit.sprite = UnitView.createSprite(unit)

		Record.add('unit', unit)
		return unit
	} else {
		return null
	}
}

const loadGoods = (unit, good, amount) => Storage.update(unit, good, amount)
const listenStorage = (unit, fn) => {
	return Storage.listen(unit, fn)
}

const save = unit => ({
	...unit,
	commander: unit.commander.save(),
	sprite: undefined,
	[Storage.LISTENER_KEY]: undefined,
	cargo: unit.cargo.map(other => Record.reference(other)),
})

const load = unit => {
	Storage.init(unit)
	unit.cargo = unit.cargo.map(Record.dereference)
	unit.sprite = UnitView.createSprite(unit)
	Record.entitiesLoaded(() => {	
		unit.commander = Commander.load(unit.commander)
		Time.schedule(unit.commander)
	})

	return unit
}

export default {
	create,
	loadGoods,
	listenStorage,
	save,
	load
}