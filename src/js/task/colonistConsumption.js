import Colonists from 'data/colonists'
import Units from 'data/units'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import Events from 'util/events'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const PROMOTION_BASE_FACTOR = 1.0 / Time.PROMOTION_BASE_TIME
const DEMOTION_BASE_FACTOR = 1.0 / Time.DEMOTION_BASE_TIME

const sortByPower = (one, other) => Colonist.power(other) - Colonist.power(one)
const consumeGoods = (colony, deltaTime, consumptionObject) => Object.entries(consumptionObject).reduce((obj, [good, amount]) => {
  const scale = PRODUCTION_BASE_FACTOR * deltaTime
  const scaledAmount = Math.min(scale * amount, colony.storage[good] || {
    'bells': colony.bells,
    'crosses': colony.crosses
  }[good] || 0)
  if (Math.round(scaledAmount / scale) > 0) {
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

const advancePromotion = (colonist, target, delta) => {
  if (!colonist.promotion.promote) {
    colonist.promotion.promote = {}
  }

  if (!colonist.promotion.promote[target]) {
    colonist.promotion.promote[target] = 0
  }

  // normal speed is 1
  let speed = 1
  // if we have a specialist in town we are faster
  if (target === 'settler' || target === 'servant' || colonist.colony.colonists.some(col => col.expert === target)) {
    speed += 1
  }
  // if we have a school in town we are faster
  if (colonist.colony.buildings.school.level > 0) {
    speed += 1
  }
  // if we have a teacher in town we are faster
  if (colonist.colony.colonists.some(col => col.expert === target && col.work.building === 'school')) {
    speed += 1
  }

  // promote
  colonist.promotion.promote[target] += delta * PROMOTION_BASE_FACTOR * speed
  if (colonist.promotion.promote[target] >= 1) {
    Colonist.update.expert(colonist, target)
    Unit.update.expert(colonist.unit, target)
    Events.trigger('notification', { type: 'learned', colonist, colony: colonist.colony })
    colonist.promotion.promote[target] = 0.5
  }

  // remove demotion slowly
  if (!colonist.promotion.demote) {
    colonist.promotion.demote = {}
  }
  Object.keys(colonist.promotion.demote).forEach(demotionTarget => {
    colonist.promotion.demote[demotionTarget] -= delta * PROMOTION_BASE_FACTOR
    if (colonist.promotion.demote[demotionTarget] <= 0) {
      delete colonist.promotion.demote[demotionTarget]
    }
  })
}

const advanceDemotion = (colonist, target, delta) => {
  if (!colonist.promotion.demote) {
    colonist.promotion.demote = {}
  }

  if (!colonist.promotion.demote[target]) {
    colonist.promotion.demote[target] = 0
  }

  colonist.promotion.demote[target] += delta * DEMOTION_BASE_FACTOR
  if (colonist.promotion.demote[target] >= 1) {
    console.log('demoted', colonist.expert, 'to', target)
    const demotionTarget = target === 'settler'
      ? null
      : target
    Colonist.update.expert(colonist, demotionTarget)
    Unit.update.expert(colonist.unit, demotionTarget)
    colonist.promotion.demote[target] = 0
  }
}


const create = (colony, good, amount) => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.sort(sortByPower)

    colony.colonists.forEach(colonist => {
      const colonistObject = (Colonists[colonist.expert] || Colonists.default)
      const consumption = colonistObject.consumption
      const currentProfession = Colonist.profession(colonist)

      colonist.promotion.satisfied = consumeGoods(colony, deltaTime, consumption.base)

      const promotionObject = consumption.promote[currentProfession]
        || consumption.promote.settler
        || consumption.promote.servant
      if (!colonist.promotion.satisfied.result) {
        colonist.promotion.promoting = {
          result: false,
          reason: 'Colonist is not satisfied'
        }
      } else if (!promotionObject) {
        colonist.promotion.promoting = {
          result: false,
          reason: `A ${Units.settler.name[colonist.expert]} cannot be promoted to a ${Units.settler.name[currentProfession]}.`
        }
      } else {
        colonist.promotion.promoting = consumeGoods(colony, deltaTime, promotionObject)
      }

      if (!colonist.promotion.satisfied.result) {
        colonist.promotion.bonus = {
          result: false,
          reason: 'Colonist is not satisfied'
        }
      } else if (!consumption.bonus) {
        colonist.promotion.bonus = {
          result: false,
          reason: `A ${Units.settler.name[colonist.expert] || 'Settler'} cannot receive bonusses.`
        } 
      } else if (colonist.promotion.promoting.result) {
        colonist.promotion.bonus = {
          result: false,
          reason: 'Colonist is already promoting'
        }
      } else {
        colonist.promotion.bonus = consumeGoods(colony, deltaTime, consumption.bonus)
      }

      colonist.mood = 0
      let newStatus = 'normal'
      if (!colonist.promotion.satisfied.result) {
        colonist.mood = -1
        newStatus = 'demoting'
        console.log('status', newStatus)
        advanceDemotion(colonist, colonistObject.demote, deltaTime)
      }
      if (colonist.promotion.promoting.result) {
        colonist.mood = 1
        newStatus = 'promoting'
        const promotionTarget = promotionObject === consumption.promote[currentProfession]
          ? currentProfession
          : promotionObject === consumption.promote.settler
            ? 'settler'
            : 'servant'

        console.log('status', newStatus)
        advancePromotion(colonist, promotionTarget, deltaTime)
      }
      if (colonist.promotion.bonus.result) {
        colonist.mood = 1
        newStatus = 'bonus'
      }

      if (newStatus !== colonist.promotionStatus) {
        Colonist.update.promotionStatus(colonist, newStatus)
      }

      const newProductionModifier = (colonist.promotion.bonus.result ? 1 : 0) + (colonist.promotion.satisfied.result ? 0 : -1)
      if (newProductionModifier !== colonist.productionModifier) {
        Colonist.update.productionModifier(colonist, newProductionModifier)
      }

      // console.log(colony.name, {
      //   profession: currentProfession,
      //   expert: colonist.expert,
      //   ...colonist.promotion
      // })
    })

    return true
  }

  return {
    update,
    sort: 5
  } 
}

export default { create }