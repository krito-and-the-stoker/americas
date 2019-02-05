import Util from 'util/util'


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
	

const costs = (state, goal) =>
	Object.values(state.settlements)
		.filter(settlement => settlement.canCreateUnit)
		.map(settlement => settlement.mapCoordinates)
		.map(coords => Util.minDistance(goal.value, coords))
		.reduce((min, test) => Math.min(min, test), 1e10)


export default {
	produces,
	needs,
	costs
}