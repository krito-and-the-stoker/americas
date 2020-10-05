import Message from 'util/message'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'


export default (colony, unit) => {
	if (unit.disbanded) {
		Message.warn('disbanded unit entering colony', colony.name, unit)
		return
	}
	if (colony.owner === unit.owner) {
		Unit.additionalEquipment(unit).forEach(pack => {
			Storage.transfer(unit.equipment, colony.storage, pack)
		})
	}

	if (!unit.colonist && unit.properties.canFound && unit.owner === colony.owner) {
		const colonist = Colonist.create(unit)
		Unit.update.colonist(unit, colonist)
	}

	Colony.add.unit(colony, unit)
	Unit.update.colony(unit, colony)
	Unit.unloadAllUnits(unit)
}
