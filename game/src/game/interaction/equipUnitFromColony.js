import Util from 'util/util'

import Storage from 'entity/storage'
import Unit from 'entity/unit'

export default (colony, unit, pack) => {
  const { good, amount } = pack
  if (unit.name === 'settler') {
    if (good === 'tools') {
      const maximumAmount = Math.min(amount, Unit.PIONEER_MAX_TOOLS - unit.equipment.tools)
      const roundedAmount = Util.quantizeDown(maximumAmount, Unit.TERRAFORM_TOOLS_CONSUMPTION)
      if (roundedAmount > 0) {
        Storage.transfer(colony.storage, unit.equipment, {
          good: 'tools',
          amount: roundedAmount,
        })
      }
    }
  }
  if (['settler', 'scout', 'soldier', 'dragoon'].includes(unit.name)) {
    if (good === 'guns' || good === 'horses') {
      const maximumAmount = Math.min(amount, 50 - unit.equipment[good])
      Storage.transfer(colony.storage, unit.equipment, {
        good,
        amount: maximumAmount,
      })
    }
  }

  if (good === 'food') {
    const maximumAmount = Math.min(amount, Unit.UNIT_FOOD_CAPACITY - unit.equipment.food)
    Storage.transfer(colony.storage, unit.equipment, {
      good,
      amount: maximumAmount,
    })
  }
}
