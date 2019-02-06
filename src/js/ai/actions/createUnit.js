import Util from 'util/util'

import Unit from 'entity/unit'

import State from 'ai/state'


const name = () => 'create unit'


const produces = goal =>
	goal.key.length === 3 &&
	goal.key[0] === 'units' &&
	!goal.key[1] &&
	goal.key[2] === 'command' &&
	goal.value === 'idle'


const needs = () => ({
	key: ['settlements', null, 'canCreateUnit'],
	value: true,
})
	

const cost = (state, goal) =>
	Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates)
		.map(coords => Util.minDistance(goal.where, coords))
		.reduce((min, test) => Math.min(min, test), 1e10)


const commit = (state, goal, next) => {
	const coords = 	Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates)
		.reduce((best, settlement) =>
			Util.minDistance(goal.where, best) < Util.minDistance(goal.where, settlement) ? best : settlement,
		{ x: 1e10, y: 1e10 })
	Unit.create('native', coords, State.dereference(state.owner))
	next()
}

export default {
	produces,
	needs,
	cost,
	commit,
	name
}