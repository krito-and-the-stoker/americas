import Actions from 'ai/actions'
import State from 'ai/state'


const create = (state, goal) => {

	Object.values(Actions)
		.filter(action => action.produces(goal))
		.map(action => action.needs(goal))
		.forEach(newGoal => {
			console.log(state, newGoal)
			console.log(State.satisfies(state, newGoal))
		})
}

export default {
	create
}