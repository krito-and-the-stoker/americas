import Colonists from 'data/colonists'
import Units from 'data/units'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const sortByPower = (one, other) => Colonist.power(other) - Colonist.power(one)
const consumeGoods = (colony, deltaTime, consumptionObject) => Object.entries(consumptionObject).reduce((obj, [good, amount]) => {
  const scale = PRODUCTION_BASE_FACTOR * deltaTime
  const scaledAmount = Math.min(scale * amount, colony.storage[good] || {
    'bells': colony.bells,
    'crosses': colony.crosses
  }[good] || 0)
  if (scaledAmount > 0) {
    if (good === 'bells') {
      Colony.update.bells(colony, -scaledAmount)
    }
    else if (good === 'crosses') {
      Colony.update.crosses(colony, -scaledAmount)
    }
    else {
      Storage.update(colony.storage, { good, amount: -scaledAmount })
    }
    Storage.update(colony.productionRecord, { good, amount: -scaledAmount / scale })
    return {
      ...obj,
      [good]: scaledAmount / scale,
      result: obj.result
    }
  }
  return {
    ...obj,
    [good]: -amount,
    result: false
  }
}, { result: true })


const create = (colony, good, amount) => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.sort(sortByPower)

    colony.colonists.forEach(colonist => {
      const consumption = (Colonists[colonist.expert] || Colonists.default).consumption
      const currentProfession = Colonist.profession(colonist)

      colonist.satisfied = consumeGoods(colony, deltaTime, consumption.base)

      if (!colonist.satisfied.result) {
        colonist.promoting = {
          result: false,
          reason: 'Colonist is not satisfied'
        }
      } else if (!consumption.promote[currentProfession]) {
        colonist.promoting = {
          result: false,
          reason: `A ${Units.settler.name[colonist.expert]} cannot be promoted to a ${Units.settler.name[currentProfession]}.`
        }
      } else {
        colonist.promoting = consumeGoods(colony, deltaTime, consumption.promote[currentProfession])
      }

      if (!colonist.satisfied.result) {
        colonist.bonus = {
          result: false,
          reason: 'Colonist is not satisfied'
        }
      } else if (!consumption.bonus) {
        colonist.bonus = {
          result: false,
          reason: `A ${Units.settler.name[colonist.expert] || 'Settler'} cannot receive a bonus.`
        } 
      } else if (colonist.promoting.result) {
        colonist.bonus = {
          result: false,
          reason: 'Colonist is already promoting'
        }
      } else {
        colonist.bonus = consumeGoods(colony, deltaTime, consumption.bonus)
      }

      colonist.mood = 0
      if (!colonist.satisfied.result) {
        colonist.mood = -1
      }
      if (colonist.promoting.result) {
        colonist.mood = 1
      }
      if (colonist.bonus.result) {
        colonist.mood = 1
      }

      console.log(colony.name, {
        profession: currentProfession,
        expert: colonist.expert,
        power: Colonist.power(colonist),
        satisfied: colonist.satisfied,
        promoting: colonist.promoting,
        bonus: colonist.bonus
      })
    })

    return true
  }

  return {
    update,
    sort: 5
  } 
}

export default { create }