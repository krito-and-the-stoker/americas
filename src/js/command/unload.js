import Dialog from '../view/dialog'
import UnitView from '../view/unit'
import Time from '../timeline/time'
import Move from './move'

const create = (unit, coords) => {
	if (unit.unloadingInProgress) {
		return {
			update: () => false
		}
	}
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
			landingUnit.unloadingInProgress = true
			unit.unloadingInProgress = true
			Time.schedule(Move.create(landingUnit, coords, () => {
				landingUnit.unloadingInProgress = false
				unit.unloadingInProgress = false
			}))
			return false
		}
	}

	return {
		type: 'unload',
		update,
		save: () => ({})
	}
}

const load = data => ({
	update: () => false
})

export default {
	create,
	load
}