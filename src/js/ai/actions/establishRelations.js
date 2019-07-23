import Record from 'util/record'

import Plan from 'ai/plan'
import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'


const create = ({ owner, contact }) => {
	console.warn('establishing', contact.referenceId)
	const prev = Plan.cheapest(Record.getAll('unit')
		.filter(unit => unit.owner.referenceId === contact.referenceId)
		.filter(unit => unit.tile.domain === 'land')
		.map(unit => MoveUnit.create(({ owner, coords: unit.tile.mapCoordinates }))))

	return prev && {
		cost: prev.cost,
		commit: () => prev.commit().then(unit => Units.unassign(unit)),
		cancel: prev.cancel,
	}
}


export default {
	create,
}