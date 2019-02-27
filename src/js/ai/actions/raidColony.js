import Util from 'util/util'

import Colony from 'entity/colony'

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
			commit: () => Promise.all(moves.map(move => move.commit()
				.then(unit => {
					if (Math.random() < 2 / Colony.protection(colony)) {
						Raid(colony, unit)
					}
					state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1
					if (!unit.disbanded) {
						state.relations[colony.owner.referenceId].militancy += 0.1
						Units.unassign(unit)
						const disbandAction = Disband.create(unit)
						cancelDisband.push(disbandAction.commit())
					} else {
						state.relations[colony.owner.referenceId].militancy -= 0.025
					}
				})))
		}
	}

	return null
}


export default {
	create
}