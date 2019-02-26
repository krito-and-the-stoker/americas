import Util from 'util/util'
import Events from 'util/events'

import Storage from 'entity/storage'

import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'

const create = ({ tribe, state, colony }) => {
	console.log('start raid', colony.name)
	const prev = MoveUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })

	return prev ? {
		cancel: prev.cancel,
		commit: () => {
			return prev.commit().then(unit => {
				Units.unassign(unit)
				commit(tribe, state, colony)
			})
		}
	} : null
}


const commit = (tribe, state, colony) => {
	console.log('raided copmlete', colony.name)
	state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = false
	// Events.trigger('dialog', {
	// 	type: 'natives',
	// 	image: tribe.image,
	// 	text: `You have made quite some progress with your village called ${colony.name}. The ${tribe.name} want to help you and gift you these ${amount} ${good}.`,
	// 	pause: true,
	// 	options: [{
	// 		text: 'Thank you my friends.',
	// 		default: true,
	// 		action: () => {
	// 			Storage.update(colony.storage, { good, amount })
	// 		}
	// 	}]
	// })
}


export default {
	create
}