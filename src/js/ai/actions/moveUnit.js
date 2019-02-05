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


const costs = () => 0


export default {
	produces,
	needs,
	costs
}