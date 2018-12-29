import Units from '../data/units.json'
import UnitView from '../view/unit'

const TILE_SIZE = 64

const create = (name, x, y) => Units[name] ? ({
	name,
	sprite: UnitView.createSprite(Units[name].id, TILE_SIZE*x, TILE_SIZE*y),
	...Units[name],
	mapCoordinates: { x, y },
	pixelCoordinates: { 
		x: TILE_SIZE*x,
		y: TILE_SIZE*y,
	}
}) : null

export default {
	create
}