import Util from 'util/util'

import Time from 'timeline/time'

import Production from 'entity/production'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'

const BELLS_TO_GOLD_FACTOR = 10
const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, building, colonist) => {
  const update = (currentTime, deltaTime) => {
    const production = Production.production(colony, building, colonist)
    const consumption = Production.consumption(building)
    const scale = deltaTime * PRODUCTION_BASE_FACTOR

    // full scale production
    let productionAmount = scale * production.amount

    // make sure we have enough goods to consume,
    // otherweise scale down 
    if (consumption) {
      productionAmount =
        Math.min(colony.storage[consumption.good], consumption.factor * productionAmount) /
        (1.0 * consumption.factor)
    }
    const consumptionAmount = consumption ? productionAmount * consumption.factor : 0
    const unscaledProductionAmount = productionAmount / scale
    const unscaledConsumptionAmount = consumptionAmount / scale

    // manufacturing
    if (production.type === 'good') {
      if (consumption) {
        Storage.update(colony.storage, {
          good: consumption.good,
          amount: -consumptionAmount,
        })
        Storage.update(colony.productionRecord, {
          good: consumption.good,
          amount: -unscaledConsumptionAmount,
        })
        Storage.update(colonist.productionRecord, {
          good: consumption.good,
          amount: -unscaledConsumptionAmount,
        })
      }
      Storage.update(colony.productionRecord, {
        good: production.good,
        amount: unscaledProductionAmount,
      })
      Storage.update(colonist.productionRecord, {
        good: production.good,
        amount: unscaledProductionAmount,
      })
      Storage.update(colonist.storage, {
        good: production.good,
        amount: productionAmount,
      })
    }

    // construction only
    if (production.type === 'construction') {
      const construction = Colony.currentConstruction(colony)
      const totalCost = Util.sum(Object.values(construction.cost))
      if (totalCost > 0) {
        // the factor with which we can produce
        const productionFactor = Util.clamp(
          Util.min(
            Object.entries(construction.cost).map(
              ([good, amount]) =>
                // the goods we have devided by the goods we need is the maximum production Factor
                colony.storage[good] / (scale * production.amount * (amount / totalCost))
            )
          )
        )

        // construct
        construction.progress += scale * productionFactor * production.amount
        Colony.update.construction(colony)
        Storage.update(colony.productionRecord, {
          good: 'construction',
          amount: productionFactor * production.amount,
        })
        Storage.update(colonist.productionRecord, {
          good: 'construction',
          amount: productionFactor * production.amount,
        })

        // consume goods
        Object.entries(construction.cost).forEach(([good, amount]) => {
          const consumed = productionFactor * production.amount * (amount / totalCost)
          Storage.update(colony.storage, {
            good,
            amount: -scale * consumed,
          })
          Storage.update(colony.productionRecord, {
            good,
            amount: -consumed,
          })
          Storage.update(colonist.productionRecord, {
            good,
            amount: -consumed,
          })
        })
      }
    }
    if (production.type === 'bells') {
      // Treasure.spend(productionAmount * BELLS_TO_GOLD_FACTOR)
      // Storage.update(colony.productionRecord, { good: 'gold', amount: -BELLS_TO_GOLD_FACTOR * unscaledProductionAmount })
      Colony.update.bells(colony, productionAmount)
      Storage.update(colony.productionRecord, {
        good: 'bells',
        amount: productionAmount / scale,
      })
      Storage.update(colonist.productionRecord, {
        good: 'bells',
        amount: productionAmount / scale,
      })
    }
    if (production.type === 'crosses') {
      Colony.update.crosses(colony, productionAmount)
      Storage.update(colony.productionRecord, {
        good: 'crosses',
        amount: productionAmount / scale,
      })
      Storage.update(colonist.productionRecord, {
        good: 'crosses',
        amount: productionAmount / scale,
      })
    }

    return true
  }


  return {
    update,
    sort: 3,
  }
}

export default { create, BELLS_TO_GOLD_FACTOR }
