import Colonists from 'data/colonists.json'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const sortByPower = (one, other) => Colonist.power(other) - Colonist.power(one)

const create = (colony, good, amount) => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.sort(sortByPower)

    colony.colonists.forEach(colonist => {
      const consumption = (Colonists[colonist.expert] || Colonists.default).consumption

      let consumed = 0
      let maxConsumed = 0
      Object.entries(consumption).forEach(([good, amount]) => {
        const scale = PRODUCTION_BASE_FACTOR * deltaTime
        const scaledAmount = Math.min(scale * amount, colony.storage[good] || {
          'bells': colony.bells,
          'crosses': colony.crosses
        }[good] || 0)
        consumed += scaledAmount / scale
        maxConsumed += amount
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
        }
      })

      colonist.mood = consumed / maxConsumed
      console.log(colony.name, colonist.expert, colonist.power, colonist.mood, consumed, maxConsumed)
    })

    return true
  }

  return {
    update,
    sort: 5
  } 
}

export default { create }