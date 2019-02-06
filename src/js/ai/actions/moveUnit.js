import Util from 'util/util'
import Events from 'util/events'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import TriggerEvent from 'command/triggerEvent'

import State from 'ai/state'


const name = () => 'move unit'


const produces = goal =>
	goal.key.length === 3 &&
	goal.key[0] === 'units' &&
	goal.key[2] === 'mapCoordinates' &&
	goal.value.length > 0


const needs = goal => ({
	key: ['units', goal.key[1], 'plan'],
	value: 'none',
	where: goal.value
})


const cost = () => 0


const commit = (state, goal, next) => {
	const units = State.free(state, 'units')

	const pair = Util.minPair(units,
		goal.value,
		(one, other) => Util.distance(one.mapCoordinates, other))
	const unit = pair.one
	const target = pair.other

	console.log('unit', unit)
	console.log('target', target)

	const free = State.allocate(state, 'units', unit.referenceId)

	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))
	Commander.scheduleBehind(unit.commander, TriggerEvent.create('ai-move-unit-complete', { unit }))

	let cancel = () => {
		free()
		Commander.clearSchedule(unit.commander)		
	}

	Events.listen('ai-move-unit-complete', params => {
		if (params.unit === unit) {
			cancel = next()
		}
	})

	// bind cancel to current scope so we can update it when the move is complete
	return () => cancel()
}


export default {
	produces,
	needs,
	cost,
	commit,
	name
}