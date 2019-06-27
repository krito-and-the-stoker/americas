import Time from 'timeline/time'

import Util from 'util/util'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const horseToFoodConversionRate = 1
const create = (colony) => {
  let lastAmount = 0
  const update = (currentTime, deltaTime) => {
    if (!colony.storage.horses || colony.storage.food > Unit.UNIT_FOOD_CAPACITY) {
      return true
    }

    const amount = Util.clamp(Unit.UNIT_FOOD_CAPACITY - colony.storage.food, 0, horseToFoodConversionRate * colony.storage.horses)
    const unscaledAmount = amount / (deltaTime * PRODUCTION_BASE_FACTOR)
    Storage.update(colony.storage, { good: 'food', amount })
    Storage.update(colony.storage, { good: 'horses', amount: -amount / horseToFoodConversionRate })
    Storage.update(colony.productionRecord, { good: 'food', amount: unscaledAmount })
    Storage.update(colony.productionRecord, { good: 'horses', amount: -unscaledAmount })

    return true
  }

  return {
    update,
    sort: 3,
  }
}

export default { create }