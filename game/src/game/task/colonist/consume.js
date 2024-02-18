import ColonistData from 'data/colonists'

import Time from 'timeline/time'

import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME


const canPromote = (colonist, profession) => false

const fulfillNeeds = (colonist, needDescription, scale) => {
  let fulfilled = true
  Storage.goods(needDescription).forEach(({ good, amount }) => {
    const want = amount
    const has = colonist.storage[good]
    if (has < want) {
      fulfilled = false
    }

    const transferAmount = Math.min(want, has)
    if (transferAmount > 0) {
      Storage.update(colonist.storage, { good, amount: -scale * transferAmount })
    }
  })

  const colony = colonist.colony
  Storage.productions(needDescription).filter(({ amount }) => amount > 0).forEach(({ good, amount }) => {
    if (['bells', 'housing', 'crosses'].includes(good)) {
      const want = amount
      const has = colony[good]
      if (has < want) {
        fulfilled = false
      }

      const transferAmount = Math.min(want, has)
      if (transferAmount > 0) {
        Colony.update[good](colony, -scale * transferAmount)
        Storage.update(colonist.storage, { good, amount: scale * transferAmount })
        Storage.update(colony.productionRecord, {
          good,
          amount: -transferAmount,
        })
        Storage.update(colonist.consumptionRecord, {
          good,
          amount: -transferAmount
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
      	const fulfilled = fulfillNeeds(colonist, foodNeeds, scale)
      	colonist.state.noFood = !fulfilled
      } else {
      	colonist.state.noFood = false
      }

      if (woodNeeds) {
      	const fulfilled = fulfillNeeds(colonist, woodNeeds, scale)
      	colonist.state.noWood = !fulfilled
      } else {
      	colonist.state.noWood = false
      }

      if (luxuryNeeds) {
      	const fulfilled = fulfillNeeds(colonist, luxuryNeeds, scale)
      	colonist.state.noLuxury = !fulfilled
      } else {
      	colonist.state.noLuxury = false
      }

      if (bonusNeeds) {
      	const fulfilled = fulfillNeeds(colonist, bonusNeeds, scale)
      	colonist.state.hasBonus = fulfilled
      } else {
      	colonist.state.hasBonus = false
      }

      if (promotionNeeds) {
      	const fulfilled = fulfillNeeds(colonist, promotionNeeds, scale)
      	colonist.state.isPromoting = fulfilled
      } else {
      	colonist.state.isPromoting = false
      }
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