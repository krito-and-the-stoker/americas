import Util from 'util/util'

import Actions from 'ai/actions'
import State from 'ai/state'


const create = (state, goal, fn) => {


	// create neighbours and find leafs
	const leafs = []
	const search = step => {
		step.satisfied = State.satisfies(state, step.goal)
		if (!step.satisfied) {
			step.prev = Object.values(Actions)
				.filter(action => action.produces(state, step.goal))
				.map(action => ({
					next: step,
					goal: action.needs(state, step.goal),
					cost: step.cost + action.cost(state, step.goal),
					name: action.name(),
					action: () => action.commit(state, step.goal, step.action)
				}))
		} else {
			leafs.push(step)
			step.prev = []
		}

		return step.prev
	}


	// build complete tree
	let infinityGuard = 0
	const initial = {
		goal,
		cost: 0,
		action: fn,
	}
	let currentSteps = search(initial)
	while(currentSteps.length > 0 && infinityGuard < 10) {
		currentSteps = currentSteps.map(step => search(step)).flat()
		infinityGuard += 1
	}

	if (leafs.length > 0) {
		const best = Util.min(leafs, step => step.cost)
		const planDescription = best => best.next.name ? `${best.name}, ${planDescription(best.next)}` : best.name

		console.log(planDescription(best))

		return best.action
	}

	return null
}

export default {
	create
}