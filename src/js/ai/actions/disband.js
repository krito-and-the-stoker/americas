import Util from 'util/util'
import Record from 'util/record'

import Unit from 'entity/unit'

import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'


const create = unit => {
	console.log('disbanding', unit.referenceId)
	const settlements = Record.getAll('settlement').filter(settlement => settlement.owner === unit.owner)
	const closest = Util.min(settlements, settlement =>
		Util.distance(settlement.mapCoordinates, unit.mapCoordinates))
	const prev = MoveUnit.create({ unit, coords: closest.mapCoordinates })

	return {
		commit: () => {
			Units.assign(unit)
			return prev.commit().then(() => {
				Units.unassign(unit)
				Unit.disband(unit)
			})
		},
		cancel: prev.cancel
	}
}


export default {
	create
}