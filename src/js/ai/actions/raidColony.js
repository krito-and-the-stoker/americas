import Util from 'util/util'
import Events from 'util/events'

import Storage from 'entity/storage'

import State from 'ai/state'


const name = () => 'raid colony'


const produces = (state, goal) =>
	goal.key.length === 5 &&
	goal.key[0] === 'relations' &&
	goal.key[1] &&
	goal.key[2] === 'colonies' &&
	goal.key[3] &&
	goal.key[4] === 'raidPlanned' &&
	goal.value


const needs = (state, goal) => ({
	key: ['units', null, 'mapCoordinates'],
	value: [State.dereference(goal.key[3]).mapCoordinates],
	name: goal.name
})


const cost = () => 0


const commit = (state, goal, next) => {
	// const tribe = State.dereference(state.tribe)
	// const colony = State.dereference(goal.key[3])
	state.relations[goal.key[1]].colonies[goal.key[3]].raidPlanned = false

	return next()
}


export default {
	produces,
	needs,
	cost,
	commit,
	name
}