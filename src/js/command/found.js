import Colony from '../entity/colony'
import UnitView from '../view/unit'

const create = unit => {
	const update = () => {
		if (!unit.canFound) {
			return false
		}

		const colony = Colony.create(unit.mapCoordinates)
		UnitView.deactivate(unit)

		return false
	}

	return {
		update
	}
}


export default { create }