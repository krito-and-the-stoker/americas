

const satisfies = (state, goal) => goal.key
	.reduce((values, key) =>
		key ?
			values.map(value => value[key]) :
			values.map(value => Object.values(value)).flat(),
	[state])
	.some(value => [goal.value].flat().includes(value))

export default {
	satisfies
}