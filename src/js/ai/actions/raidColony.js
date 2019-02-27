import Util from 'util/util'
import Events from 'util/events'

// import Colony from 'entity/colony'
// import Unit from 'entity/unit'

import MoveUnit from 'ai/actions/moveUnit'
import Disband from 'ai/actions/disband'

import Raid from 'interaction/raid'
import Units from 'ai/resources/units'

const create = ({ tribe, state, colony }) => {
	console.log('starting raid on', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
	const moves = Util.range(state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
		.map(() => MoveUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })).filter(a => !!a)

	if (moves.length > 0) {
		let cancelDisband = []
		return {
			cancel: () => {
				moves.forEach(move => move.cancel())
				Util.execute(cancelDisband)
			},
			commit: () => {
				return Promise.all(moves.map(move => new Promise(resolve => {
					const unit = move.unit
					let cleanup = () => {
						// only do this once
						cleanup = () => {}

						Util.execute[unsubscribeBattle, unsubscribeRaid]
						state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1

						if (!unit.disbanded) {
							// state.relations[colony.owner.referenceId].militancy += 0.1
							Units.unassign(unit)
	
							const disbandAction = Disband.create(unit)
							cancelDisband.push(disbandAction.commit())						
						}
						resolve()
					}

					// raid when in range
					const unsubscribeRaid = Events.listen('meet', params => {
						if (params.colony === colony && params.unit === unit) {
							console.log('raiding', params.unit, colony)
							Raid(colony, params.unit)

							cleanup()
						}
					})

					// die trying..
					const unsubscribeBattle = Events.listen('battle', params => {
						if (params.loser === unit) {
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