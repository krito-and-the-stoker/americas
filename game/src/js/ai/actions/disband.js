import Util from 'util/util'
import LA from 'util/la'
import Record from 'util/record'
import Message from 'util/message'

import Unit from 'entity/unit'
import Storage from 'entity/storage'

import MoveUnit from 'ai/actions/moveUnit'
import Units from 'ai/resources/units'


const create = unit => {
	Message.log('disbanding', unit.name, unit.referenceId)
	const settlement = Util.choose(Record.getAll('settlement')
		.filter(settlement => settlement.owner === unit.owner && Util.distance(settlement.mapCoordinates, unit.mapCoordinates) < 10)) ||
			Util.min(
				Record.getAll('settlement').filter(settlement => settlement.owner === unit.owner),
				settlement => LA.distance(unit.mapCoordinates, settlement.mapCoordinates)
			)
	const prev = MoveUnit.create({ unit, coords: settlement.mapCoordinates })

	return {
		commit: () => {
			Units.assign(unit)
			return prev.commit().then(() => {
				Units.unassign(unit)
				if (!unit.disbanded) {				
					Storage.transfer(unit.equipment, settlement.tribe.storage)
					Unit.disband(unit)
					settlement.population += 1
				}
			})
		},
		cancel: prev.cancel
	}
}


export default {
	create
}