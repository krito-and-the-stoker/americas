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
	key: ['units', goal.key[1], 'command'],
	value: 'idle',
	where: goal.value
})


const cost = () => 0


const commit = (state, goal, next) => {
	const unit = State.dereference(Object.entries(state.units)
		.filter(([, unit]) => unit.command === 'idle')
		.reduce(([bestId, bestUnit], [testId, testUnit]) =>
			Util.minDistance(goal.value, bestUnit.mapCoordinates) < Util.minDistance(goal.value, testUnit.mapCoordinates) ? [bestId, bestUnit] : [testId, testUnit],
		[-1, { mapCoordinates: { x: 1e10, y: 1e10 } }])[0])

	const target = goal.value.reduce((best, test) => Util.distance(unit.mapCoordinates, best) < Util.distance(unit.mapCoordinates, test) ? best : test, goal.value[0])
	Commander.scheduleInstead(unit.commander, MoveTo.create(unit, target))
	Commander.scheduleBehind(unit.commander, TriggerEvent.create('ai-move-complete', { unit }))
	Events.listen('ai-move-complete', params => {
		if (params.unit === unit) {
			next()
		}
	})
}


export default {
	produces,
	needs,
	cost,
	commit,
	name
}