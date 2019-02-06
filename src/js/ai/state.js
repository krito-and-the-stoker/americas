import Record from 'util/record'


const satisfies = (state, goal) => goal.key
	.reduce((values, key) =>
		key ?
			values.map(value => value[key]) :
			values.map(value => Object.values(value)).flat(),
	[state])
	.some(value => [goal.value].flat().includes(value))


const dereference = referenceId => Record.dereference({ referenceId: Number(referenceId) })


export default {
	satisfies,
	dereference
}