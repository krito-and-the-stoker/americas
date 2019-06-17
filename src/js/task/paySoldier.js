import Time from 'timeline/time'

import Storage from 'entity/storage'

import Treasure from 'entity/treasure'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const UNIT_COST = {
  soldier: 5,
  dragoon: 10
}

const create = unit => {
  const update = (currentTime, deltaTime) => {
    if (!UNIT_COST[unit.name]) {
      return
    }

    const amount = deltaTime * PRODUCTION_BASE_FACTOR * UNIT_COST[unit.name]
    Treasure.gain(-amount)

    return true
  }

  return {
    update,
  }
}

export default { create }