import Record from 'util/record'

import Plan from 'ai/plan'
import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'


const create = ({ owner, contact }) => {
	const prev = Plan.cheapest(Record.getAll('unit')
		.filter(unit => unit.owner.referenceId === contact.referenceId)
		.filter(unit => unit.tile.domain === 'land')
		.map(unit => MoveUnit.create(({ owner, coords: unit.mapCoordinates }))))

	console.log(`establish-relations-${contact.referenceId}`)

	return prev ? {
		name: `establish-relations-${contact.referenceId}`,
		cost: prev.cost,
		commit: () => {
			prev.commit().then(unit => Units.unassign(unit))
		},
		cancel: prev.cancel,
	} : null
}


export default {
	create,
}