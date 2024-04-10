import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony) => {
  const update = (currentTime, deltaTime) => {
    const amount = Colony.rebels(colony)
    const scaledAmount = deltaTime * amount * PRODUCTION_BASE_FACTOR

    // bells must not become negative
    if (colony.bells <= scaledAmount && scaledAmount > 0) {
      const efficiency = colony.bells / scaledAmount

      Colony.update.bells(colony, -efficiency * scaledAmount)
      Storage.update(colony.productionRecord, {
        good: 'bells',
        amount: -efficiency * amount,
      })
    } else {
      Colony.update.bells(colony, -scaledAmount)
      Storage.update(colony.productionRecord, { good: 'bells', amount: -amount })
    }

    return true
  }

  return {
    update,
  }
}

export default { create }
