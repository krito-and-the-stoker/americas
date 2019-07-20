import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const FOOD_COST = 2
const FOOD_COST_PER_HORSE = 0.02 // 1 food per 50 horses
const CHANCE_OF_DEATH = 0.05

const create = unit => {
  const update = (currentTime, deltaTime) => {
    if (unit.equipment.food < -0.1) {
      // console.log('unit is starving now', unit, unit.equipment.food)
      if (Math.random() < CHANCE_OF_DEATH) {
        Unit.disband(unit)
      }
      return true
    }

    const unscaledAmount = FOOD_COST + (unit.equipment.horses + unit.storage.horses) * FOOD_COST_PER_HORSE
    const scaledAmount = deltaTime * PRODUCTION_BASE_FACTOR * unscaledAmount

    Storage.update(unit.equipment, { good: 'food', amount: -scaledAmount })

    return true
  }

  return {
    update,
    sort: 2
  } 
}

export default { create }