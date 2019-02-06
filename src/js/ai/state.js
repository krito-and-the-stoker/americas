import Util from 'util/util'
import Record from 'util/record'


const satisfies = (state, goal) => goal.key
	.reduce((values, key) =>
		key ?
			values.map(value => value[key]) :
			values.map(value => Object.values(value)).flat(),
	[state])
	.some(value => [goal.value].flat().includes(value))


const dereference = referenceId => Record.dereference({ referenceId: Number(referenceId) })

const free = (state, key) => Object.entries(state[key])
	.filter(([, entity]) => entity.plan === 'none')
	.map(([referenceId]) => dereference(referenceId))

const allocate = (state, key, id) => {
	state[key][id].plan = `in-use-${Util.uid()}`

	return () => {
		state[key][id].plan = 'none'
	}
}


export default {
	satisfies,
	dereference,
	free,
	allocate
}