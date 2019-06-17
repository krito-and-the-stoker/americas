import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = unit => {
  const update = (currentTime, deltaTime) => {
    if (unit.equipment.food < 0) {
      console.log('unit should die now')
      // Unit.disband(unit)
    }

    const amount = 2 + (unit.equipment.horses + unit.storage.horses) / 50
    const scaledAmount = deltaTime * amount * PRODUCTION_BASE_FACTOR

    Storage.update(unit.equipment, { good: 'food', amount: -scaledAmount })

    return true
  }

  return {
    update,
    sort: 2
  } 
}

export default { create }