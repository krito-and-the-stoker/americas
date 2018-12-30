import Units from '../data/units.json'
import UnitView from '../view/unit'

const create = (name, x, y) => {
	if (Units[name]) {	
		const unit = {
			name,
			...Units[name],
			mapCoordinates: { x, y },
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