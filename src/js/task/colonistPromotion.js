import Colonists from 'data/colonists'
import Goods from 'data/goods'

import Util from 'util/util'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import Events from 'util/events'


const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const PROMOTION_BASE_FACTOR = 1.0 / Time.PROMOTION_BASE_TIME
const DEMOTION_BASE_FACTOR = 1.0 / Time.DEMOTION_BASE_TIME
const POWER_TRANSFER_BASE_FACTOR = 1.0 / Time.POWER_TRANSFER_BASE_TIME

const sortByPower = (one, other) => Colonist.power(other) - Colonist.power(one)

const addScaledAmountToColony = (colony, good, scaledAmount, scale) => {
  if (good === 'bells') {
    Colony.update.bells(colony, scaledAmount)
  }
  else if (good === 'crosses') {
    Colony.update.crosses(colony, scaledAmount)
  }
  else {
    Storage.update(colony.storage, { good, amount: scaledAmount })
  }
  Storage.update(colony.productionRecord, { good, amount: scaledAmount / scale })  
}

const consumeGoods = (colonist, deltaTime, consumptionObject) => Object.entries(consumptionObject).reduce((obj, [good, amount]) => {
  const colony = colonist.colony
  const production = Colonist.production(colonist)
  const scale = PRODUCTION_BASE_FACTOR * deltaTime
  let scaledAmount = scale * amount
  if (colonist.expert === 'slave'
    ||( production && production.good !== good)) {
    scaledAmount = Math.min(scaledAmount,
    colony.storage[good] || {
      'bells': colony.bells,
      'crosses': colony.crosses
    }[good] || 0)
  }

  if (Math.round(scaledAmount / scale) >= amount) {
    addScaledAmountToColony(colony, good, -scaledAmount, scale)

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

const roundGoodAmounts = statusObject => Util.makeObject(Object.entries(statusObject)
  .map(([good, value]) => ([good, Goods[good] ? Math.round(value) : value])))

const returnUnusedGoods = (statusObject, colony, deltaTime) => {
  if (statusObject.result) {
    return roundGoodAmounts(statusObject)
  }

  const scale = PRODUCTION_BASE_FACTOR * deltaTime

  return {
    ...Util.makeObject(Object.entries(statusObject)
      .filter(([good]) => Goods[good])
      .map(([good, value]) => {
        if (value > 0) {
          addScaledAmountToColony(colony, good, value * scale, scale)

          return [good, 0]
        }

        return [good, Math.round(value)]
      })),
    result: false,
    reason: statusObject.reason
  }
}

const advancePromotion = (colonist, target, delta) => {
  if (!colonist.promotion.promote) {
    colonist.promotion.promote = {}
  }

  if (!colonist.promotion.promote[target]) {
    colonist.promotion.promote[target] = 0
  }

  // normal speed is 1
  colonist.promotion.speed = 1
  // if we have a specialist in town we are faster
  if (target === 'settler' || target === 'servant' || colonist.colony.colonists.some(col => col.expert === target)) {
    colonist.promotion.speed += 2
  }
  // if we have a school in town we are faster
  if (colonist.colony.buildings.school.level > 0) {
    colonist.promotion.speed += 2*colonist.colony.buildings.school.level
  }
  // if we have a teacher in town we are faster
  if (colonist.colony.colonists.some(col => col.expert === target && col.work.building === 'school')) {
    colonist.promotion.speed *= 3
  }

  // promote
  colonist.promotion.promote[target] += delta * PROMOTION_BASE_FACTOR * colonist.promotion.speed
  if (colonist.promotion.promote[target] >= 1) {
    Colonist.update.expert(colonist, target)
    Unit.update.expert(colonist.unit, target)
    Events.trigger('notification', { type: 'learned', colonist, colony: colonist.colony })

    //keep 80% of the promotion progress to go back more easily
    colonist.promotion.promote[target] = 0.8
  }

  Colonist.update.promotion(colonist)
}

const advanceDemotion = (colonist, target, delta) => {
  if (!colonist.promotion.demote) {
    colonist.promotion.demote = {}
  }

  if (!colonist.promotion.demote[target]) {
    colonist.promotion.demote[target] = 0
  }

  // the less goods the faster the demotion goes
  colonist.promotion.satisfactionLevel = Object.values(colonist.promotion.satisfied)
    .filter(value => typeof value === 'number')
    .reduce((all, value) => ({
      supplied: all.supplied + (value > 0 ? value : 0),
      demanded: all.demanded + Math.abs(value)
    }), {
      supplied: 0,
      demanded: 0
    })
  const demotionStrength = 1 - colonist.promotion.satisfactionLevel.supplied / colonist.promotion.satisfactionLevel.demanded

  colonist.promotion.demote[target] += delta * DEMOTION_BASE_FACTOR * demotionStrength
  if (colonist.promotion.demote[target] >= 1) {
    console.log('demoted', colonist.expert, 'to', target)
    const demotionTarget = target === 'settler'
      ? null
      : target

    if (!colonist.promotion.promote) {
      colonist.promotion.promote = {}
    }

    // keep 80% so promotion back again goes much more quickly
    colonist.promotion.promote[colonist.expert || 'settler'] = 0.8

    Colonist.update.expert(colonist, demotionTarget)
    Unit.update.expert(colonist.unit, demotionTarget)
    delete colonist.promotion.demote[target]
  }

  Colonist.update.promotion(colonist)
}

const rollbackDemotion = (colonist, delta) => {
  // remove demotion slowly
  if (!colonist.promotion.demote) {
    colonist.promotion.demote = {}
  }
  Object.keys(colonist.promotion.demote).forEach(demotionTarget => {
    colonist.promotion.demote[demotionTarget] -= delta * DEMOTION_BASE_FACTOR
    if (colonist.promotion.demote[demotionTarget] <= 0) {
      delete colonist.promotion.demote[demotionTarget]
    }
  })

  Colonist.update.promotion(colonist)
}


const create = (colony, good, amount) => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.sort(sortByPower)

    // transfer power to those who have
    colony.colonists.forEach((colonist, index) => {
      colonist.power += (colony.colonists.length + colonist.mood - 2 * index) * POWER_TRANSFER_BASE_FACTOR * deltaTime
    })

    colony.colonists.forEach(colonist => {
      const colonistObject = (Colonists[colonist.expert] || Colonists.default)
      const consumption = colonistObject.consumption
      const currentProfession = Colonist.profession(colonist)

      colonist.promotion.satisfied = roundGoodAmounts(consumeGoods(colonist, deltaTime, consumption.base))

      const promotionObject = consumption.promote[currentProfession]
        || consumption.promote.settler
        || consumption.promote.servant
      if (!colonist.promotion.satisfied.result) {
        colonist.promotion.promoting = {
          result: false,
          reason: 'Basic goods are not fully supplied'
        }
      } else if (!promotionObject) {
        colonist.promotion.promoting = {
          result: false,
          reason: colonist.expert === currentProfession
            ? `This ${Colonist.expertName(colonist)} has mastered his profession.`
            : colonist.expert === 'slave'
              ? 'Slaves do not promote'
              : `A ${Colonist.expertName(colonist)} cannot be promoted to ${Colonist.professionName(currentProfession)} directly.`
        }
      } else {
        colonist.promotion.promoting = returnUnusedGoods(consumeGoods(colonist, deltaTime, promotionObject), colonist.colony, deltaTime)
      }

      if (!colonist.promotion.satisfied.result) {
        colonist.promotion.bonus = {
          result: false,
          reason: 'Basic goods are not fully supplied'
        }
      } else if (!consumption.bonus) {
        colonist.promotion.bonus = {
          result: false,
          reason: `A ${Colonist.expertName(colonist)} will never receive a bonus.`
        } 
      } else if (colonist.promotion.promoting.result) {
        colonist.promotion.bonus = {
          result: false,
          reason: 'Colonist is promoting'
        }
      } else {
        colonist.promotion.bonus = returnUnusedGoods(consumeGoods(colonist, deltaTime, consumption.bonus), colonist.colony, deltaTime)
      }

      colonist.mood = 0
      let newStatus = 'normal'
      if (!colonist.promotion.satisfied.result) {
        colonist.mood = -1
        if (colonistObject.demote) {        
          newStatus = 'demoting'
          advanceDemotion(colonist, colonistObject.demote, deltaTime)
        } else {
          newStatus = 'malus'
        }
      }
      if (colonist.promotion.promoting.result) {
        colonist.mood = 1
        newStatus = 'promoting'
        const promotionTarget = promotionObject === consumption.promote[currentProfession]
          ? currentProfession
          : promotionObject === consumption.promote.settler
            ? 'settler'
            : 'servant'

        advancePromotion(colonist, promotionTarget, deltaTime)
        rollbackDemotion(colonist, deltaTime)
      }
      if (colonist.promotion.bonus.result) {
        colonist.mood = 1
        newStatus = 'bonus'
        rollbackDemotion(colonist, deltaTime)
      }

      if (newStatus === 'normal') {
        rollbackDemotion(colonist, deltaTime)
      }

      if (newStatus !== colonist.promotionStatus) {
        Colonist.update.promotionStatus(colonist, newStatus)
      }

      const newProductionModifier = (colonist.promotion.bonus.result ? 2 : 0) + (colonist.promotion.satisfied.result ? 0 : -1)
      if (newProductionModifier !== colonist.productionModifier) {
        Colonist.update.productionModifier(colonist, newProductionModifier)
      }
    })

    return true
  }

  return {
    update,
    sort: 5
  } 
}

export default { create }