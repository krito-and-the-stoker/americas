import Time from 'timeline/time'

import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const horseToFoodConversionRate = 1
const create = (colony) => {
  let lastAmount = 0
  const update = (currentTime, deltaTime) => {
    if (!colony.storage.horses || colony.storage.food > 0) {
      return true
    }

    const amount = Math.max(0, Math.min(-colony.storage.food, horseToFoodConversionRate * colony.storage.horses))
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