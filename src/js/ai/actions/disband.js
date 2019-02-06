import Unit from 'entity/unit'

import State from 'ai/state'


const name = () => 'disband'

const produces = goal =>
	goal.key.length === 3 &&
	goal.key[0] === 'units' &&
	goal.key[1] &&
	goal.key[2] === 'scheduled' &&
	goal.value === 'disband'

const needs = (state, goal) => ({
	key: ['units', goal.key[1], 'mapCoordinates'],
	value: State.all(state, 'settlements').map(settlement => settlement.mapCoordinates)
})

const cost = () => 0

const commit = (state, goal, next) => {
	const unit = State.dereference(goal.key[1])
	Unit.disband(unit)
	return next()
}


export default {
	name,
	produces,
	needs,
	cost,
	commit
}