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
					let cleanup = () => {
						// only do this once
						cleanup = () => {}

						Util.execute([unsubscribeBattle, unsubscribeRaid])
						state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1

						if (!move.unit.disbanded) {
							Units.unassign(move.unit)
	
							const disbandAction = Disband.create(move.unit)
							cancelDisband.push(disbandAction.commit())						
						}
						resolve()
					}

					// raid when in range
					const unsubscribeRaid = Events.listen('meet', params => {
						if (params.colony === colony && params.unit === move.unit) {
							Raid(colony, params.unit)

							cleanup()
						}
					})

					// die trying..
					const unsubscribeBattle = Events.listen('battle', params => {
						if (params.loser === move.unit) {
							cleanup()
						}
					})

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