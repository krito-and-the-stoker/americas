import Units from '../data/units.json'
import UnitView from '../view/unit'

const TILE_SIZE = 64

const create = (name, x, y) => {
	if (Units[name]) {	
		const unit = {
			name,
			...Units[name],
			mapCoordinates: { x, y },
			pixelCoordinates: { 
				x: TILE_SIZE*x,
				y: TILE_SIZE*y,
			}
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