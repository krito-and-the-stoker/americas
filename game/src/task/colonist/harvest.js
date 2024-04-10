import Time from 'timeline/time'

import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME

const create = (colony) => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.forEach(colonist => {
      if (colonist.work && colonist.work.type === 'Field') {
        const tile = colonist.work.tile
        const good = colonist.work.good

        if (tile.harvestedBy && colonist && tile.harvestedBy !== colonist) {
          console.warn('tile already harvested by', tile.harvestedBy)
          return
        }

        // consider caching these values, as they do not change frequently
        const unscaledProduction = Tile.production(tile, good, colonist)
        const production = unscaledProduction * PRODUCTION_BASE_FACTOR

        const amount = deltaTime * production
        Storage.update(colonist.storage, { good, amount })
        Storage.update(colony.productionRecord, {
          good,
          amount: unscaledProduction,
        })
        Storage.update(colonist.productionRecord, {
          good,
          amount: unscaledProduction,
        })
      }
    })

    return true
  }

  const finished = () => unsubscribe()

  return {
    update,
    finished,
  }
}

export default { create }
