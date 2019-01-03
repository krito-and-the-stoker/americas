import Dialog from '../view/dialog'
import UnitView from '../view/unit'
import Time from '../timeline/time'
import Move from './move'
import Commander from './commander'

const create = (unit, coords) => {
	let decision = null
	let unloading = false
	let done = false
	Dialog.show('unload').then(result => { decision = result })

	const update = () => {
		if (unloading) {
			return true
		}

		if (done) {
			return false
		}

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
			Commander.scheduleInstead(landingUnit.commander, Move.create(landingUnit, coords, () => {
				unloading = false
				done = true
			}))
			unloading = true
			return true
		}
	}

	return {
		type: 'unload',
		update,
	}
}

const load = data => ({
	update: () => false
})

export default {
	create,
	load
}