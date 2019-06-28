import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

import EquipUnitFromColony from 'interaction/equipUnitFromColony'


export default colonist => {
	const colony = colonist.colony
	const unit = colonist.unit

	if (unit) {
		EquipUnitFromColony(colony, unit, { good: 'food', amount: colony.storage.food })
	}
	Colonist.stopWorking(colonist)
	Colony.remove.colonist(colonist)
	Colonist.update.colony(colonist, null)

	if (colony.colonists.length === 0 && unit) {
		Storage.transfer(colony.storage, unit.equipment)
		Colony.disband(colony)
	}
}