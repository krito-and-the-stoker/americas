import Util from 'util/util'
import Events from 'util/events'

import Storage from 'entity/storage'

import State from 'ai/state'


const name = () => 'visit colony'


const produces = (state, goal) =>
	goal.key.length === 5 &&
	goal.key[0] === 'relations' &&
	goal.key[1] &&
	goal.key[2] === 'colonies' &&
	goal.key[3] &&
	goal.key[4] === 'visited' &&
	goal.value


const needs = (state, goal) => ({
	key: ['units', null, 'mapCoordinates'],
	value: [State.dereference(goal.key[3]).mapCoordinates],
	amount: 2,
	name: goal.name
})


const cost = () => 0


const commit = (state, goal, next) => {
	const tribe = State.dereference(state.tribe)
	const colony = State.dereference(goal.key[3])
	const good = Util.choose(['food', 'cotton', 'furs', 'tobacco', 'sugar', 'coats', 'cloth'])
	const amount = Math.round(4 + 10 * Math.random())
	state.relations[goal.key[1]].colonies[goal.key[3]].visited = true
	Events.trigger('dialog', {
		type: 'natives',
		image: tribe.image,
		text: `You have made quite some progress with your village called ${colony.name}. The ${tribe.name} want to help you and gift you these ${amount} ${good}.`,
		pause: true,
		options: [{
			text: 'Thank you my friends.',
			default: true,
			action: () => {
				Storage.update(colony.storage, { good, amount })
			}
		}]
	})

	return next()
}


export default {
	produces,
	needs,
	cost,
	commit,
	name
}