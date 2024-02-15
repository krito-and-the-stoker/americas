import Util from 'util/util'

import Time from 'timeline/time'

import Storage from 'entity/storage'
import Unit from 'entity/unit'
import Colony from 'entity/colony'
import Tile from 'entity/tile'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const REFILL_BASE = 2
const IN_COLONY_FACTOR = 10

const create = (unit, tile) => {
  const isColonistInColony = () =>
    unit.colonist && tile.colony && unit.colonist.colony === tile.colony

  const update = (currentTime, deltaTime) => {
    if (!unit.properties.equipment) {
      return true
    }

    const colony = Tile.supportingColony(tile)
    if (!colony) {
      return true
    }

    if (isColonistInColony()) {
      return true
    }

    const unscale = amount => amount / (deltaTime * PRODUCTION_BASE_FACTOR)

    const packs = Storage.goods(unit.equipment).filter(
      pack => unit.properties.equipment[pack.good] > 0
    )

    if (packs.length === 0) {
      return
    }

    packs.forEach(pack => {
      const capacity = unit.properties.equipment[pack.good]
      if (pack.amount > capacity) {
        const giveback = {
          good: pack.good,
          amount: pack.amount - capacity,
        }
        Storage.transfer(unit.equipment, colony.storage, giveback)
      }

      if (Colony.canFillEquipment(colony, unit, pack.good)) {
        const amount = Math.min(
          capacity - pack.amount,
          colony.storage[pack.good],
          REFILL_BASE *
            deltaTime *
            PRODUCTION_BASE_FACTOR *
            (unit.colony === colony ? IN_COLONY_FACTOR : 1)
        )

        if (amount > 0) {
          Storage.transfer(colony.storage, unit.equipment, {
            good: pack.good,
            amount,
          })
          Storage.update(colony.productionRecord, {
            good: pack.good,
            amount: -unscale(amount),
          })
          Storage.update(unit.consumptionRecord, {
            good: pack.good,
            amount: -unscale(amount)
          })
        }
      }
    })

    return true
  }

  return {
    update,
    sort: 6,
  }
}

export default { create }
