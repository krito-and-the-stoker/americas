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
				.filter(action => action.produces(step.goal))
				.map(action => ({
					next: step,
					goal: action.needs(step.goal),
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
		action: fn
	}
	let currentSteps = search(initial)
	while(currentSteps.length > 0 && infinityGuard < 10) {
		currentSteps = currentSteps.map(step => search(step)).flat()
		infinityGuard += 1
	}

	console.log(initial)
	console.log(leafs)

	if (leafs.length > 0) {
		// const start = leafs.reduce((best, step) => best.cost < step.cost ? best : step, leafs[0])
		const start = Util.min(leafs, step => step.cost)
		return start.action
		// const plan = []
		// let step = start
		// infinityGuard = 0
		// while(step.goal !== goal && infinityGuard < 10) {
		// 	plan.push(step)
		// 	step = step.next
		// 	infinityGuard += 1
		// }

		// return plan
	}

	return null
}

export default {
	create
}