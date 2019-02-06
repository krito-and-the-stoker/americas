import Util from 'util/util'

import Unit from 'entity/unit'

import State from 'ai/state'


const name = () => 'create unit'


const produces = (state, goal) =>
	goal.key.length === 3 &&
	goal.key[0] === 'units' &&
	!goal.key[1] &&
	goal.key[2] === 'goal' &&
	goal.value === goal.name &&
	goal.where


const needs = (state, goal) => ({
	key: ['settlements', null, 'canCreateUnit'],
	value: true,
	name: goal.name
})


const cost = (state, goal) => Object.values(state.settlements).length > 0 ?
	1 + Util.minPairValue(Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates), goal.where, Util.distance) : 0


const commit = (state, goal, next) => {
	const coords = 	Util.minPair(Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates), goal.where, Util.distance).one

	const unit = Unit.create('native', coords, State.dereference(state.owner))
	state.units[unit.referenceId] = {
		goal: goal.name
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