import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'

import Unit from 'entity/unit'

import MoveUnit from 'ai/actions/moveUnit'
import Disband from 'ai/actions/disband'

import Raid from 'interaction/raid'
import Units from 'ai/resources/units'

const create = ({ tribe, state, colony }) => {
	Message.log('starting raid on', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
	const unitPlans = Util.range(state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
		.map(() => GetUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })).filter(a => !!a)

	if (unitPlans.length > 0) {
		let cancelDisband = []
		return {
			cancel: () => {
				Util.execute(unitPlans.map(unit => unit.cancel))
				Util.execute(cancelDisband)
			},
			dismiss: () => Util.execute(unitPlans.dismiss),
			commit: () => {
				return Promise.all(unitPlans.map(plan => new Promise(resolve => {
					// let cleanupDone = false
					// let cleanup = () => {
					// 	// only do this once
					// 	if (cleanupDone) {
					// 		return
					// 	}

					// 	Util.execute(unsubscribe)
					// 	state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1
					// 	if (state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned < 0) {
					// 		state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = 0
					// 	}

					// 	if (!plan.unit.disbanded) {
					// 		Units.unassign(plan.unit)
	
					// 		const disbandAction = Disband.create(plan.unit)
					// 		cancelDisband.push(disbandAction.commit())						
					// 	}

					// 	cleanupDone = true
					// 	resolve()
					// }

					// const unsubscribe = [
					// 	// raid when in range
					// 	Events.listen('meet', params => {
					// 		if (params.colony === colony && params.unit === plan.unit) {
					// 			if(Raid(colony, params.unit)) {
					// 				cleanup()
					// 			}
					// 		}
					// 	}),

					// 	// if unit gets too scared it just retreats
					// 	Events.listen('retreat', params => {
					// 		if (params.unit === plan.unit) {
					// 			cleanup()
					// 		}
					// 	})
					// ]

					// reach colony
					plan.commit().then(cleanup)
				})))
			}
		}
	}

	return null
}


export default {
	create
}