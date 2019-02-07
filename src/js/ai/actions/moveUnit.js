import Util from 'util/util'
import Events from 'util/events'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import TriggerEvent from 'command/triggerEvent'

import State from 'ai/state'


const name = () => 'move unit'


const produces = (state, goal) =>
	goal.key.length === 3 &&
	goal.key[0] === 'units' &&
	goal.key[2] === 'mapCoordinates' &&
	goal.value.length > 0


const needs = (state, goal) => ({
	key: ['units', goal.key[1], 'goal'],
	value: goal.name,
	where: goal.value,
	name: goal.name
})


const cost = () => 0


const commit = (state, goal, next) => {
	const units = State.allocated(state, 'units', goal)

	const pair = Util.minPair(units,
		goal.value,
		(one, other) => Util.distance(one.mapCoordinates, other))
	const unit = pair.one
	const target = pair.other

	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))
	Commander.scheduleBehind(unit.commander, TriggerEvent.create('ai-move-unit-complete', { unit }))

	let cancel = () => {
		Commander.clearSchedule(unit.commander)
		Util.execute(unsubscribe)
	}

	const unsubscribe = Events.listen('ai-move-unit-complete', params => {
		if (params.unit === unit) {
			Util.execute(unsubscribe)
			cancel = next()
		}
	})

	// bind cancel to current scope so we can update it when the move is complete
	return () => Util.execute(cancel)
}


export default {
	produces,
	needs,
	cost,
	commit,
	name
}