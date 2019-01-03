import Colony from '../entity/colony'
import UnitView from '../view/unit'
import Record from '../util/record'

const create = unit => {
	const init = () => {
		if (!unit.canFound) {
			return false
		}

		UnitView.deactivate(unit)
		const colony = Colony.create(unit.mapCoordinates, unit)

		return false
	}

	const save = () => {
		unit: Record.reference(unit)
	}

	return {
		type: 'found',
		init,
		save
	}
}

const load = data => create(Record.dereference(data.unit))

export default { create, load }