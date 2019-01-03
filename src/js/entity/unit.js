import Units from '../data/units.json'
import UnitView from '../view/unit'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Record from '../util/record'

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
			expert: null,
			...additionalProps
		}
		unit.sprite = UnitView.createSprite(unit)

		Record.add('unit', unit)
		return unit
	} else {
		return null
	}
}

const save = unit => ({
	...unit,
	sprite: undefined,
	cargo: unit.cargo.map(other => Record.reference(other))
})

const load = unit => {
	unit.cargo = unit.cargo.map(Record.dereference)
	unit.sprite = UnitView.createSprite(unit)
	console.log('loaded', unit)
	return unit
}

export default {
	create,
	save,
	load
}