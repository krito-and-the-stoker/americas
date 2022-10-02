import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'

import MoveUnit from 'ai/actions/moveUnit'
import Disband from 'ai/actions/disband'

import Raid from 'interaction/raid'
import Units from 'ai/resources/units'

const create = ({ tribe, state, colony }) => {
	Message.log('starting raid on', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
	const moves = Util.range(state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
		.map(() => MoveUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })).filter(a => !!a)

	if (moves.length > 0) {
		let cancelDisband = []
		return {
			cancel: () => {
				Util.execute(moves.map(move => move.cancel))
				Util.execute(cancelDisband)
			},
			dismiss: () => Util.execute(moves.dismiss),
			commit: () => {
				return Promise.all(moves.map(move => new Promise(resolve => {
					let cleanupDone = false
					let cleanup = () => {
						// only do this once
						if (cleanupDone) {
							return
						}

						Util.execute(unsubscribe)
						state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1
						if (state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned < 0) {
							state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = 0
						}

						if (!move.unit.disbanded) {
							Units.unassign(move.unit)
	
							const disbandAction = Disband.create(move.unit)
							cancelDisband.push(disbandAction.commit())						
						}

						cleanupDone = true
						resolve()
					}

					const unsubscribe = [
						// raid when in range
						Events.listen('meet', params => {
							if (params.colony === colony && params.unit === move.unit) {
								if(Raid(colony, params.unit)) {
									cleanup()
								}
							}
						}),
						// if we had a battle, we are satisfied and can go home
						Events.listen('combat', params => {
							if (params.attacker === move.unit || params.defender === move.unit) {
								cleanup()
							}
						})
					]

					// reach colony
					move.commit().then(cleanup)
				})))
			}
		}
	}

	return null
}


export default {
	create
}