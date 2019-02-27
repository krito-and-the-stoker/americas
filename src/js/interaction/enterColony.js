import Unit from 'entity/unit'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

export default (colony, unit) => {
	if (unit.disbanded) {
		console.warn('disbanded unit entering colony', colony.name, unit)
		return
	}
	if (colony.owner === unit.owner) {
		Unit.additionalEquipment(unit).forEach(pack => {
			Storage.transfer(unit.equipment, colony.storage, pack)
		})
	}

	Colony.add.unit(colony, unit)
	Unit.update.colony(unit, colony)
	Unit.unloadAllUnits(unit)
}
