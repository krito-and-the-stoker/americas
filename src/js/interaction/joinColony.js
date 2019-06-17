import Colony from 'entity/colony'
import Storage from 'entity/storage'
import Colonist from 'entity/colonist'


export default (colony, colonist) => {
	Colonist.update.colony(colonist, colony)
	Colony.add.colonist(colony, colonist)
  Storage.goods(colonist.unit.equipment)
    .filter(pack => pack.good !== 'food')
    .forEach(pack => Storage.transfer(colonist.unit.equipment, colony.storage, pack))
}
