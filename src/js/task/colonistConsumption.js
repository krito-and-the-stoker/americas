import Colonists from 'data/colonists'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const sortByPower = (one, other) => Colonist.power(other) - Colonist.power(one)
const consumeGoods = (colony, deltaTime, consumptionObject) => Object.entries(consumptionObject).reduce((result, [good, amount]) => {
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
    return true
  }
  return false
}, true)


const create = (colony, good, amount) => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.sort(sortByPower)

    colony.colonists.forEach(colonist => {
      const consumption = (Colonists[colonist.expert] || Colonists.default).consumption
      const currentProfession = Colonist.profession(colonist)

      const satisfied = consumeGoods(colony, deltaTime, consumption.base)

      const promoting = satisfied
        && (consumption.promote[currentProfession] || false)
        && consumeGoods(colony, deltaTime, consumption.promote[currentProfession])

      const bonus = satisfied
        && !promoting
        && (consumption.bonus || false)
        && consumeGoods(colony, deltaTime, consumption.bonus)

      colonist.mood = 0
      if (!satisfied) {
        colonist.mood = -1
      }
      if (promoting) {
        colonist.mood = 1
      }
      if (bonus) {
        colonist.mood = 1
      }

      console.log(colony.name, colonist.expert, Colonist.power(colonist), { currentProfession, satisfied, promoting, bonus })
    })

    return true
  }

  return {
    update,
    sort: 5
  } 
}

export default { create }