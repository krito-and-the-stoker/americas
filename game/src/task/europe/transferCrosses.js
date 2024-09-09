import Time from 'timeline/time'

import Europe from 'entity/europe'
import Colony from 'entity/colony'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = colony => {
  const update = (currentTime, deltaTime) => {
    if (colony) {
      Europe.update.crosses(colony.crosses)
      Colony.update.crosses(colony, -colony.crosses)
    } else {
      const crossProduction = 1 - Math.max(0, Europe.state.units.length - 1)
      Europe.update.crosses(deltaTime * PRODUCTION_BASE_FACTOR)
    }

    return true
  }

  return {
    update,
  }
}

export default { create }
