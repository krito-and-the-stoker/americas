import Util from 'util/util'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const MAX_FOOD_STOCK = 20
const MAX_FOOD_FILL = 50

const create = (unit, colony) => {
  const update = (currentTime, deltaTime) => {
    const desiredAmount = Util.clamp(MAX_FOOD_STOCK - unit.equipment.food, 0, MAX_FOOD_FILL)
    const scaledAmount = Math.min(colony.storage.food, deltaTime * desiredAmount * PRODUCTION_BASE_FACTOR)
    const unscaledAmount = scaledAmount / (deltaTime * PRODUCTION_BASE_FACTOR)

    Storage.update(unit.equipment, { good: 'food', amount: scaledAmount })
    Storage.update(colony.storage, { good: 'food', amount: -scaledAmount })
    Storage.update(colony.productionRecord, { good: 'food', amount: -unscaledAmount })
    
    return true
  }

  return {
    update,
    sort: 3
  } 
}

export default { create }