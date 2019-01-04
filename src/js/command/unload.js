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

	const save = () => ({
		type: 'unload',
		decision,
		unloading,
		done,
		coords,
		unit: Record.reference(unit),
		landingUnit: Record.reference(landingUnit)
	})

	return {
		update,
		save
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	if (data.decision === null) {
		return create(unit, data.coords)
	}
	if (decision === 1) {
		return Commander.cancel()
	}
	if (data.decision === 0 && data.unloading && !data.done) {
		// TODO: find a solution to this problem
		console.warn('loading of unload command not implemented yet')
		return Commander.cancel()
	}
}

export default {
	create,
	load
}