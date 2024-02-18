import Time from 'timeline/time'
import Colonist from 'entity/colonist'

const POWER_TRANSFER_BASE_FACTOR = 1.0 / Time.POWER_TRANSFER_BASE_TIME

const create = colony => {
  const update = (currentTime, deltaTime) => {
    // transfer power to those who have
    colony.colonists.forEach((colonist, index) => {
      colonist.power +=
        (colony.colonists.length + colonist.mood - 2 * index) *
        POWER_TRANSFER_BASE_FACTOR *
        deltaTime
      if (Colonist.power(colonist) < 0) {
        colonist.power -= Colonist.power(colonist)
      }
    })

    return true
  }

  return {
    update
  }
}

export default {
  create
}