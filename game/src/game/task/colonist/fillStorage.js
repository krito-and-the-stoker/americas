import ColonistData from 'data/colonists'

import Time from 'timeline/time'

import Colonist from 'entity/colonist'
import Storage from 'entity/storage'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const STORAGE_PER_POWER = 1.0 / 10 // 1 storage factor for every 10 power
const MAXIMUM_TRANSFER = 20 // a colonist can not get transfer more goods per production cycle

const needForGood = (needDescription, good) => needDescription ? needDescription[good] || 0 : 0

const create = colony => {
  const update = (_, deltaTime) => {
    const scale = PRODUCTION_BASE_FACTOR * deltaTime
    const maximumTransfer = scale * MAXIMUM_TRANSFER

    colony.colonists.forEach(colonist => {
      const properties = ColonistData[colonist.unit.expert] || ColonistData.default
      const consumption = properties.consumption
      const profession = Colonist.profession(colonist)
      const promotionTarget = Colonist.promotionTarget(colonist)

      const foodNeeds = consumption.food
      const woodNeeds = consumption.wood
      const bonusNeeds = consumption.bonus
      const luxuryNeeds = consumption.luxury
      const promotionNeeds = Colonist.canPromote(colonist) && Colonist.needsForPromotion(promotionTarget)

      // 10 * Colonist.power is the power the colonist has,
      // the function is factored down for no good reason
      const storageFactor = 2 * scale + STORAGE_PER_POWER * 10 * Colonist.power(colonist)

      const target = good => storageFactor * (
        needForGood(foodNeeds, good) +
        needForGood(woodNeeds, good) +
        needForGood(bonusNeeds, good) +
        needForGood(luxuryNeeds, good) +
        needForGood(promotionNeeds, good)
      )

      Storage.goods(colony.storage).forEach(({ good, amount }) => {
        const want = target(good) - colonist.storage[good]
        const transferAmount = Math.min(want, amount, maximumTransfer)

        if (transferAmount !== 0) {
          Storage.transfer(colony.storage, colonist.storage, { good, amount: transferAmount })
        }
      })
    })

    return true
  }

  return {
    update,
    sort: 2,
  }
}

export default { create }
