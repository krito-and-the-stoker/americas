import Units from '../data/units.json'
import UnitView from '../view/unit'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'

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
			...additionalProps
		}
		unit.sprite = UnitView.createSprite(unit)
		return unit
	} else {
		return null
	}
}

export default {
	create
}