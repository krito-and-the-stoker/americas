import ColonistData from 'data/colonists.json'

import Time from 'timeline/time'

import Util from 'util/util'

import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Storage from 'entity/storage'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

interface State {
  noFood: boolean
  noWood: boolean
  noLuxury: boolean
  isPromoting: boolean
  hasBonus: boolean
}


interface StorageEntity {
  [key: string]: number
}
interface UnitEntity {
  expert: string
}

type NeedsObject<T> = {
  food: T
  wood: T
  luxury: T
  bonus: T
  promotion: T
}

interface ColonistEntity {
  state: State
  storage: StorageEntity
  consumptionRecord: StorageEntity
  colony: ColonyEntity
  consumptionBreakdown: {
    want: NeedsObject<StorageEntity>
    has: NeedsObject<StorageEntity>
    state: NeedsObject<boolean>
  }
  unit: UnitEntity
}


interface ColonyEntity {
  colonists: ColonistEntity[]
  productionRecord: StorageEntity
  storage: StorageEntity
  bells: number
  housing: number
  crosses: number
}

type Pack = {
  good: string
  amount: number
}

const hasColonistStateChanged = (colonist: ColonistEntity, oldState: State) => {
  const keys = ['noFood', 'noWood', 'noLuxury', 'isPromoting', 'hasBonus'] as (keyof State)[]
  return keys.some(key => colonist.state[key] !== oldState[key])
}


const takeFromStorage = (colonist: ColonistEntity, pack: Pack, scale: number) => {
  const { good, amount } = pack

  let fulfillment = 0
  if (!['bells', 'housing', 'crosses'].includes(good)) {
    // require 1% less to avoid rounding errors, that lead to state flipping
    const want = 0.99 * scale * amount
    const has = colonist.storage[good]
    if (has < want) {
      fulfillment = has - want
    } else {
      fulfillment = want
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
  } else {
    const colony = colonist.colony
    // take a little bit less so we do not produce rounding artefacts
    const want = 0.99 * scale * amount
    const has = colony[good as 'bells' | 'housing' | 'crosses']
    if (has < want) {
      fulfillment = has - want
    } else {
      fulfillment = want
    }

    const transferAmount = Math.min(want, has)
    if (transferAmount > 0) {
      // @ts-ignore
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
  }

  return Math.round(fulfillment / scale)
}


const create = (colony: ColonyEntity) => {
  const update = (_: number, deltaTime: number) => {
    const scale = PRODUCTION_BASE_FACTOR * deltaTime

    colony.colonists.forEach(colonist => {
      // @ts-ignore
      const properties = ColonistData[colonist.unit.expert] || ColonistData.default
      const consumption = properties.consumption
      const target = Colonist.promotionTarget(colonist)

      colonist.consumptionBreakdown.want = {
        food: consumption.food,
        wood: consumption.wood,
        luxury: consumption.luxury,
        bonus: consumption.bonus,
        promotion: Colonist.canPromote(colonist) && Colonist.needsForPromotion(target),
      }

      const oldState = { ...colonist.state }

      Object.keys(colonist.consumptionBreakdown.want).forEach((needTypeParam) => {
        // but why, typescript, do we have to do this in a convoluted way?
        // we are iterating over the keys of want, so how would this not be a key of want?
        const needType: keyof typeof colonist.consumptionBreakdown.want = needTypeParam as any
        const want = colonist.consumptionBreakdown.want[needType]
        if (want && Util.sum(Storage.packs(want).map(pack => pack.amount)) > 0) {
          colonist.consumptionBreakdown.state[needType] = true
          colonist.consumptionBreakdown.has[needType] = {}
          Storage.packs(want).filter(({ amount }) => amount > 0).forEach(pack => {
            colonist.consumptionBreakdown.has[needType][pack.good] = takeFromStorage(colonist, pack, scale)
            if (colonist.consumptionBreakdown.has[needType][pack.good] < 0) {
              colonist.consumptionBreakdown.state[needType] = false
            }
          })
        } else {
          // state is not applicable
          colonist.consumptionBreakdown.state[needType] = false
        }
      })

      Colonist.update.consumptionBreakdown(colonist)

      colonist.state.noFood = colonist.consumptionBreakdown.want.food && !colonist.consumptionBreakdown.state.food || false
      colonist.state.noWood = colonist.consumptionBreakdown.want.wood && !colonist.consumptionBreakdown.state.wood || false
      colonist.state.noLuxury = colonist.consumptionBreakdown.want.luxury && !colonist.consumptionBreakdown.state.luxury || false
      colonist.state.hasBonus = colonist.consumptionBreakdown.state.bonus
      colonist.state.isPromoting = colonist.consumptionBreakdown.state.promotion


      if (hasColonistStateChanged(colonist, oldState)) {
        Colonist.update.state(colonist)
      }
    })

    return true
  }

  return {
    update,
    sort: 4,
  }
}




export default {
	create
}