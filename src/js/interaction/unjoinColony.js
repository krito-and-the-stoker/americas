import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'


export default colonist => {
	const colony = colonist.colony
	Colonist.stopWorking(colonist)
	Colony.remove.colonist(colonist)
	Colonist.update.colony(colonist, null)

	if (colony.colonists.length === 0) {
		Storage.transfer(colony.storage, colonist.unit.equipment)
		Colony.disband(colony)
	}
}