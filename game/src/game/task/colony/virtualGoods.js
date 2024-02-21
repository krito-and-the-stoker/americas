import Buildings from 'data/buildings'

import Util from 'util/util'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Building from 'entity/building'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = colony => {
  const update = (currentTime, deltaTime) => {
    const scale = deltaTime * PRODUCTION_BASE_FACTOR
    Colony.update.housing(colony, -colony.housing)
    Colony.update.crosses(colony, -colony.crosses)

    // handle growth
    if (colony.storage.food > 0) {
      Colony.update.growth(colony, colony.colonists.length * scale)
    }

    return true
  }

  return {
    update,
    sort: 1,
  }
}

export default {
  create,
}
