import Actions from 'ai/actions'
import State from 'ai/state'


const create = (state, goal) => {


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
	let currentSteps = search({
		goal,
		cost: 0,
		action: () => console.log('plan fulfilled')
	})
	while(currentSteps.length > 0 && infinityGuard < 10) {
		currentSteps = currentSteps.map(step => search(step)).flat()
		infinityGuard += 1
	}

	if (leafs.length > 0) {
		const start = leafs.reduce((best, step) => best.cost < step.cost ? best : step, leafs[0])
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