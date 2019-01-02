import Colony from '../entity/colony'
import UnitView from '../view/unit'

const create = unit => {
	const update = () => {
		if (!unit.canFound) {
			return false
		}

		UnitView.deactivate(unit)
		const colony = Colony.create(unit.mapCoordinates, unit)

		return false
	}

	return {
		update
	}
}


export default { create }