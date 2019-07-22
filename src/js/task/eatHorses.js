import Time from 'timeline/time'

import Util from 'util/util'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony) => {
  let lastAmount = 0
  const update = (currentTime, deltaTime) => {
    if (!colony.storage.horses) {
      return true
    }

    if (colony.storage.horses > colony.capacity) {
      // eat surplus horses
      const amount = colony.storage.horses - colony.capacity
      const unscaledAmount = amount / (PRODUCTION_BASE_FACTOR * deltaTime)
      Storage.update(colony.storage, { good: 'horses', amount: -amount })
      Storage.update(colony.storage, { good: 'food', amount })
      Storage.update(colony.productionRecord, { good: 'horses', amount: -unscaledAmount })
      Storage.update(colony.productionRecord, { good: 'food', amount: unscaledAmount })
    }


    // eat horses when out of food
    const amount = Util.clamp(-colony.storage.food, 0, colony.storage.horses)
    const unscaledAmount = amount / (deltaTime * PRODUCTION_BASE_FACTOR)
    Storage.update(colony.storage, { good: 'food', amount })
    Storage.update(colony.storage, { good: 'horses', amount: -amount })
    Storage.update(colony.productionRecord, { good: 'food', amount: unscaledAmount })
    Storage.update(colony.productionRecord, { good: 'horses', amount: -unscaledAmount })

    return true
  }

  return {
    update,
    sort: 4,
  }
}

export default { create }