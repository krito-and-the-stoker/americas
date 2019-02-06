import Util from 'util/util'


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
	

const cost = (state, goal) => 0
	// Object.values(state.settlements)
	// 	.filter(settlement => settlement.canCreateUnit)
	// 	.map(settlement => settlement.mapCoordinates)
	// 	.map(coords => Util.minDistance(goal.where, coords))
	// 	.reduce((min, test) => Math.min(min, test), 1e10)


export default {
	produces,
	needs,
	cost,
	name
}