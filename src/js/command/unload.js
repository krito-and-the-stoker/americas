import Dialog from '../view/ui/dialog'
import UnitView from '../view/unit'
import Time from '../timeline/time'
import Move from './move'
import Commander from './commander'
import Record from '../util/record'
import Unit from '../entity/unit'

const createUnloadingOnly = unloadingStartedAt => {
	const update = currentTime => {
		return  currentTime < unloadingStartedAt + Time.UNLOAD_TIME		
	}

	const save = () => ({
		unloadingStartedAt,
		decision: 0,
	})

	return {
		update,
		save
	}
}

const create = (unit, coords) => {
	let decision = null
	let unloadingStartedAt = null
	let landingUnit = null
	Dialog.show('unload').then(result => { decision = result })

	const update = currentTime => {
		if (unloadingStartedAt) {
			return  currentTime < unloadingStartedAt + Time.UNLOAD_TIME
		}

		if (decision === null) {
			return true
		}

		if (decision === 1) {
			return false
		}

		if (decision === 0) {
			landingUnit = Unit.unloadUnit(unit)
			Commander.scheduleInstead(landingUnit.commander, Move.create(landingUnit, coords))
			unloadingStartedAt = currentTime
			return true
		}
	}

	const save = () => ({
		type: 'unload',
		decision,
		unloadingStartedAt,
		coords,
		unit: Record.reference(unit),
		landingUnit: Record.reference(landingUnit)
	})

	return {
		type: 'unload',
		update,
		save
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	if (data.decision === null) {
		return create(unit, data.coords)
	}
	if (data.decision === 1) {
		return Commander.cancel()
	}
	if (data.decision === 0 && data.unloadingStartedAt) {
		return createUnloadingOnly(data.unloadingStartedAt)
	}
}

export default {
	create,
	load
}