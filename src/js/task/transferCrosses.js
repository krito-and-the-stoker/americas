import Time from 'timeline/time'

import Europe from 'entity/europe'
import Colony from 'entity/colony'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony) => {
  const update = (currentTime, deltaTime) => {
    if (colony) {
      Europe.update.crosses(colony.crosses)
    } else {
      Europe.update.crosses(deltaTime * PRODUCTION_BASE_FACTOR)
    }

    return true
  }

  return {
    update,
    sort: 6
  }
}

export default { create }