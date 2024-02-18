import ColonistData from 'data/colonists'

import Time from 'timeline/time'

import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME


const canPromote = (colonist, profession) => false

const fulfillNeeds = (colonist, needDescription, scale) => {
  let fulfilled = true
  
  Storage.goods(needDescription).filter(({ amount }) => amount > 0).forEach(({ good, amount }) => {
    const want = scale * amount
    const has = colonist.storage[good]
    if (has < want) {
      fulfilled = false
    }

    const transferAmount = Math.min(want, has)
    if (transferAmount > 0) {
      Storage.update(colonist.storage, { good, amount: -transferAmount })
      Storage.update(colonist.colony.productionRecord, {
        good,
        amount: -transferAmount / scale,
      })
      Storage.update(colonist.consumptionRecord, {
        good,
        amount: -transferAmount / scale
      })
    }
  })

  const colony = colonist.colony
  Storage.productions(needDescription).filter(({ amount }) => amount > 0).forEach(({ good, amount }) => {
    if (['bells', 'housing', 'crosses'].includes(good)) {
      const want = scale * amount
      const has = colony[good]
      if (has < want) {
        fulfilled = false
      }

      const transferAmount = Math.min(want, has)
      if (transferAmount > 0) {
        Colony.update[good](colony, -transferAmount)
        Storage.update(colonist.storage, { good, amount: transferAmount })
        Storage.update(colony.productionRecord, {
          good,
          amount: -transferAmount / scale,
        })
        Storage.update(colonist.consumptionRecord, {
          good,
          amount: -transferAmount / scale,
        })
      }
    } else {
      console.warn('Invalid consumption good', good)
    }
  })

  return fulfilled
}


const create = colony => {
  const update = (_, deltaTime) => {
    const scale = PRODUCTION_BASE_FACTOR * deltaTime

    colony.colonists.forEach(colonist => {
      const properties = ColonistData[colonist.unit.expert] || ColonistData.default
      const consumption = properties.consumption
      const profession = Colonist.profession(colonist)

      const foodNeeds = consumption.food
      const woodNeeds = consumption.wood
      const bonusNeeds = consumption.bonus
      const luxuryNeeds = consumption.luxury
      const promotionNeeds = canPromote(colonist, profession) && ColonistData[profession]?.luxury

      if (foodNeeds) {
      	colonist.state.noFood = !fulfillNeeds(colonist, foodNeeds, scale)
      } else {
      	colonist.state.noFood = false
      }

      if (woodNeeds) {
      	colonist.state.noWood = !fulfillNeeds(colonist, woodNeeds, scale)
      } else {
      	colonist.state.noWood = false
      }

      if (luxuryNeeds) {
      	colonist.state.noLuxury = !fulfillNeeds(colonist, luxuryNeeds, scale)
      } else {
      	colonist.state.noLuxury = false
      }

      if (bonusNeeds) {
      	colonist.state.hasBonus = fulfillNeeds(colonist, bonusNeeds, scale)
      } else {
      	colonist.state.hasBonus = false
      }

      if (promotionNeeds) {
      	colonist.state.isPromoting = fulfillNeeds(colonist, promotionNeeds, scale)
      } else {
      	colonist.state.isPromoting = false
      }

      Colonist.update.state(colonist)
    })

    return true
  }

  return {
    update,
    sort: 3,
  }
}




export default {
	create
}