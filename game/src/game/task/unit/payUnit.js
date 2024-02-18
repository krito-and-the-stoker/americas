import Time from 'timeline/time'

import Treasure from 'entity/treasure'
import Europe from 'entity/europe'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = unit => {
  const update = (currentTime, deltaTime) => {
    if (!unit.properties.cost) {
      return false
    }

    if (!Europe.has.unit(unit)) {
      const amount = deltaTime * PRODUCTION_BASE_FACTOR * unit.properties.cost
      Treasure.gain(-amount)
    }

    return true
  }

  return {
    update,
  }
}

export default { create }
