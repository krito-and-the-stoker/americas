import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'
import Unit from 'entity/unit'

import EquipUnitFromColony from 'interaction/equipUnitFromColony'

export default colonist => {
  const colony = colonist.colony
  const unit = colonist.unit

  if (unit) {
    EquipUnitFromColony(colony, unit, {
      good: 'food',
      amount: colony.storage.food,
    })
    if (colonist.work && colonist.work.building === 'church') {
      Unit.updateType(unit, 'missionary')
    }
  }
  Colonist.stopWorking(colonist)
  Colony.remove.colonist(colonist)
  Colonist.update.colony(colonist, null)

  if (colony.colonists.length === 0) {
    if (unit) {
      Storage.transfer(colony.storage, unit.equipment)
    }
    Colony.disband(colony)
  }
}
