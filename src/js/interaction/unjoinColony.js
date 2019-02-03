import Colonist from 'entity/colonist'
import Colony from 'entity/colony'


export default colonist => {
	const colony = colonist.colony
	Colonist.stopWorking(colonist)
	Colony.remove.colonist(colonist)
	Colonist.update.colony(colonist, null)

	if (colony.colonists.length === 0) {
		Colony.disband(colony)
	}
}