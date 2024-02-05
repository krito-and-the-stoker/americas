import Time from 'timeline/time'

import Events from 'util/events'

import Storage from 'entity/storage'
import Unit from 'entity/unit'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const MOVEMENT_EQUIPMENT_FACTOR = 0.005

const create = unit => {
  const isColonistInColony = () => unit.colonist && unit.colonist.colony

  const update = (currentTime, deltaTime) => {
    if (isColonistInColony()) {
      return true
    }

    if (!Unit.isMoving(unit)) {
      return true
    }

    if (!unit.properties.equipment) {
      return true
    }

    Storage.goods(unit.properties.equipment).forEach(pack => {
      const amount =
        deltaTime * PRODUCTION_BASE_FACTOR * MOVEMENT_EQUIPMENT_FACTOR * pack.amount
      Storage.update(unit.equipment, { good: pack.good, amount: -amount })
    })

    return true
  }

  return {
    update,
    sort: 3,
  }
}

export default { create }
