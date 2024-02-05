import Record from 'util/record'


const satisfies = (state, goal) => goal.key
	.reduce((values, key) =>
		key ?
			values.map(value => value[key]) :
			values.map(value => Object.values(value)).flat(),
	[state])
	.some(value => [goal.value].flat().includes(value))


const dereference = referenceId => Record.dereference({ referenceId: Number(referenceId) })

const all = (state, key) => Object.keys(state[key])
	.map(referenceId => {
		if (!dereference(referenceId)) {
			delete state[key][referenceId]
		}

		return dereference(referenceId)
	})
	.filter(x => !!x)
const free = (state, key) => Object.entries(state[key])
	.filter(([, entity]) => entity.goal === 'none')
	.map(([referenceId]) => dereference(referenceId))

const allocated = (state, key, goal) => goal ? Object.entries(state[key])
	.filter(([, entity]) => entity.goal === goal.name)
	.map(([referenceId]) => dereference(referenceId)) : free(state, key)

const cleanup = (state, goals) => {
	Object.values(state.units)
		.filter(unit => !goals.map(goal => goal.name).includes(unit.goal))
		.forEach(unit => unit.goal = 'none')
}



export default {
	satisfies,
	dereference,
	allocated,
	cleanup,
	free,
	all,
}