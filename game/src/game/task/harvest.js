import Time from 'timeline/time'

import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony, tile, good, colonist = null) => {
  if (tile.harvestedBy && colonist) {
    return {}
  }

  if (!colonist) {
    console.log('harvesting for colony not supported anymore', colony.name)
    return {}
  }

  let production = 0
  let unscaledProduction = 0
  const calculate = () =>
    Tile.listen.tile(tile, () =>
      Colony.listen.productionBonus(colony, () => {
        return Colonist.listen.productionModifier(colonist, productionModifier => {
          unscaledProduction = Tile.production(tile, good, colonist)
          production = unscaledProduction * PRODUCTION_BASE_FACTOR
        })
      })
    )

  const unsubscribe = colonist ? Unit.listen.expert(colonist.unit, calculate) : calculate()

  Tile.update.harvestedBy(tile, colonist)
  const update = (currentTime, deltaTime) => {
    const amount = deltaTime * production
    Storage.update(colony.storage, { good, amount })
    Storage.update(colony.productionRecord, {
      good,
      amount: unscaledProduction,
    })
    Storage.update(colonist.productionRecord, {
      good,
      amount: unscaledProduction,
    })

    return true
  }

  const finished = () => unsubscribe()

  return {
    update,
    finished,
    sort: 1,
  }
}

export default { create }
