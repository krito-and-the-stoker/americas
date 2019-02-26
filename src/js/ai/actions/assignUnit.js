import Util from 'util/util'

import State from 'ai/state'


const name = () => 'assign unit'


// const produces = (state, goal) =>
// 	goal.key.length === 3 &&
// 	goal.key[0] === 'units' &&
// 	(goal.key[1] || goal.where) &&
// 	goal.key[2] === 'goal' &&
// 	goal.value === goal.name


// const needs = (state, goal) => ({
// 	key: ['units', goal.key[1], 'goal'],
// 	value: 'none',
// 	name: goal.name
// })


// const cost = (state, goal) => {
// 	if (goal.key[1]) {
// 		if (goal.where) {
// 			return Util.minDistance(goal.where, State.dereference(goal.key[1]).mapCoordinates)
// 		} else {
// 			return 0
// 		}
// 	} else {
// 		const units = State.free(state, 'units')
// 		if (units.length > 0) {
// 			return Util.minPairValue(units.map(unit => unit.mapCoordinates), goal.where, Util.distance)
// 		}
// 	}

// 	return 0
// }

const create = coords => {
	return null
}

const commit = (state, goal, next) => {
	if (goal.key[1]) {
		state.units[goal.key[1]].goal = goal.name
		return next()
	}

	const unit = Util.minPair(State.free(state, 'units'), goal.where.map(coords => ({ mapCoordinates: coords })), Util.entityDistance).one
	state.units[unit.referenceId] = {
		goal: goal.name
	}

	return next()
}

export default {
	create,
	commit,
	name
}