import Util from 'util/util'

import Unit from 'entity/unit'

import State from 'ai/state'


const name = () => 'create unit'


const produces = goal =>
	goal.key.length === 3 &&
	goal.key[0] === 'units' &&
	!goal.key[1] &&
	goal.key[2] === 'plan' &&
	goal.value === 'none'


const needs = () => ({
	key: ['settlements', null, 'canCreateUnit'],
	value: true,
})
	

const cost = (state, goal) =>
	Util.minPairValue(Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates), goal.where, Util.distance)


const commit = (state, goal, next) => {
	const coords = 	Util.minPair(Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates), goal.where, Util.distance).one

	const unit = Unit.create('native', coords, State.dereference(state.owner))
	state.units[unit.referenceId] = {
		plan: 'none'
	}

	return next()
}

export default {
	produces,
	needs,
	cost,
	commit,
	name
}