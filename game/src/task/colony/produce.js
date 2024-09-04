import Buildings from 'data/buildings'

import Util from 'util/util'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Building from 'entity/building'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const HORSE_PER_1_GROWTH = 50.0

const create = (colony, good) => {
  if (['housing', 'horses'].includes(good)) {
    const update = (currentTime, deltaTime) => {
      const scale = deltaTime * PRODUCTION_BASE_FACTOR

      let amount = 0
      if (good === 'housing') {
        amount = Colony.housing(colony)
        Colony.update.housing(colony, amount * scale)
      }
      if (good === 'horses') {
        amount = Math.floor(colony.storage.horses / HORSE_PER_1_GROWTH)
        Storage.update(colony.storage, { good, amount: scale * amount })
      }

      Storage.update(colony.productionRecord, {
        good,
        amount,
      })

      return true
    }

    return {
      update,
    }
  } else {
    console.warn('cannot produce good:', colony, good)
  }

  return {
    alive: false
  }
}

export default {
  create,
}
