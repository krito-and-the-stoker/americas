import Actions from 'ai/actions'
import State from 'ai/state'


const create = (state, goal) => {

	const plan = {
		goal,
		cost: 0,
		prev: null
	}

	// build prevs
	const search = step => {
		step.satisfied = State.satisfies(state, step.goal)
		if (!step.satisfied) {
			step.prev = Object.values(Actions)
				.filter(action => action.produces(step.goal))
				.map(action => ({
					goal: action.needs(step.goal),
					cost: step.cost + action.cost(state, goal),
					name: action.name(),
					action
				}))
		} else {
			step.prev = []
		}

		return step.prev
	}

	// build complete tree
	let currentSteps = search(plan)
	let i = 0
	while(currentSteps.length > 0 && i < 10) {
		currentSteps = currentSteps.map(step => search(step)).flat()
		i += 1
	}

	console.log(plan)
}

export default {
	create
}