import Dialog from '../view/dialog'
import UnitView from '../view/unit'
import Time from '../timeline/time'
import Move from './move'

const create = (unit, coords) => {
	let decision = null
	Dialog.show('unload').then(result => { decision = result })

	const update = () => {
		if (decision === null) {
			return true
		}

		if (decision === 1) {
			return false
		}

		if (decision === 0) {
			const landingUnit = unit.cargo.shift()
			landingUnit.mapCoordinates = { ...unit.mapCoordinates }
			UnitView.activate(landingUnit)
			Time.schedule(Move.create(landingUnit, coords))
			return false
		}
	}

	return {
		update
	}
}


export default { create }