import Buildings from 'data/buildings'

import Util from 'util/util'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Building from 'entity/building'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, good, amount) => {
  if (['bells', 'housing', 'crosses'].includes(good)) {
    const update = (currentTime, deltaTime) => {
      const scale = deltaTime * PRODUCTION_BASE_FACTOR

      Colony.update[good](colony, amount * scale)
      Storage.update(colony.productionRecord, {
        good,
        amount,
      })

      return true
    }

    return {
      update,
      sort: 2,
    }
  } else {
    console.warn('cannot produce good:', colony, good, amount)
  }

  return {
    alive: false
  }
}

export default {
  create,
}
