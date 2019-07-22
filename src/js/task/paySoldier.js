import Time from 'timeline/time'

import Storage from 'entity/storage'

import Treasure from 'entity/treasure'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const UNIT_COST_FACTOR = 10

const create = unit => {
  const update = (currentTime, deltaTime) => {
    if (!unit.properties.cost) {
      return false
    }

    if (!(unit.domain === 'land' && unit.offTheMap)) {
      const amount = deltaTime * PRODUCTION_BASE_FACTOR * UNIT_COST_FACTOR * unit.properties.cost
      Treasure.gain(-amount)
    }

    return true
  }

  return {
    update,
  }
}

export default { create }