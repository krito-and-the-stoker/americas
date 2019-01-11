import Colony from '../entity/colony'
import Storage from '../entity/storage'

export default (colony, colonist) => {
	colonist.colony = colony
	Colony.add.colonist(colony, colonist)
	Storage.transfer(colonist.unit.equipment, colony.storage)
}
