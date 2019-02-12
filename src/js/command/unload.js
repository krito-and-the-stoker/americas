import Record from 'util/record'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Move from 'command/move'
import Commander from 'command/commander'


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

	const init = () => {	
		Events.trigger('dialog', {
			type: 'naval',
			text: 'Would you like to disembark here?',
			coords: unit.mapCoordinates,
			options: [{
				text: 'Make landfall',
				action: () => decision = 0
			}, {
				text: 'Stay with the ships',
				action: () => decision = 1,
				default: true
			}]
		})

		return true
	}

	const update = currentTime => {
		if (unloadingStartedAt) {
			return currentTime < unloadingStartedAt + Time.UNLOAD_TIME
		}

		if (decision === null) {
			return true
		}

		if (decision === 1) {
			return false
		}

		if (decision === 0) {
			Events.trigger('disembark')
			landingUnit = Unit.unloadUnit(unit)
			Commander.scheduleInstead(landingUnit.commander, Move.create({ unit: landingUnit, coords }))
			unloadingStartedAt = currentTime
			return true
		}
	}

	const save = () => ({
		module: 'Unload',
		decision,
		unloadingStartedAt,
		coords,
		unit: Record.reference(unit),
		landingUnit: Record.reference(landingUnit)
	})

	return {
		update,
		init,
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