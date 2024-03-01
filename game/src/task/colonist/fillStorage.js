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

    const transfers = colony.colonists.map(colonist => {
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

      const packs = Storage.goods(colony.storage).map(({ good, amount }) => {
        return {
          good,
          target: target(good)
        }
      })

      return {
        packs,
        colonist
      }
    })

    // these two must be different steps, because
    // colonists produce and harvest into their personal storage
    // so we must first have every colonist put his goods onto the big pile...
    transfers.forEach(({ colonist, packs }) => {
      // give back own production onto storage pile
      packs.forEach(({ good, target }) => {
        const want = target - colonist.storage[good]
        if (want < 0) {
          Storage.transfer(colony.storage, colonist.storage, { good, amount: want })
        }
      })
    })

    // ... and only once we have gathered all goods, the most powerful take what they need etc.
    transfers.forEach(({ colonist, packs }) => {
      // take production from storage pile
      packs.forEach(({ good, target }) => {
        const want = target - colonist.storage[good]
        const amount = Math.min(want, colony.storage[good], maximumTransfer)
        if (amount > 0) {
          Storage.transfer(colony.storage, colonist.storage, { good, amount })
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
