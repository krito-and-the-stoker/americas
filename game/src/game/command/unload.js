import Record from 'util/record'
import Events from 'util/events'
import LA from 'util/la'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import Tile from 'entity/tile'

// TODO: use factory for creation
// it seems that unloading is a bit chaotic anyway...
const createUnloadingOnly = unloadingStartedAt => {
  const update = currentTime => {
    return currentTime < unloadingStartedAt + Time.UNLOAD_TIME
  }

  const save = () => ({
    unloadingStartedAt,
    decision: 0,
  })

  return {
    update,
    save,
    state: {
      info: {
        id: 'unload',
        display: 'Unloading unit',
      },
    },
  }
}

const create = (unit, coords) => {
  let decision = null
  let unloadingStartedAt = null
  let landingUnit = null

  const transport = unit

  const init = () => {
    Events.trigger('ui-dialog', {
      name: 'disembark',
      context: {
        unit,
        yes: () => {
          decision = 'yes'
          landingUnit = transport.passengers.find(x => !!x)
          if (!landingUnit) {
            console.error('Unloading, but transport has no passengers')
            decision = 'no'
            return null
          }

          Unit.update.offTheMap(landingUnit, transport.offTheMap)
          Unit.update.mapCoordinates(landingUnit, { ...transport.mapCoordinates })
          Unit.update.isBoarding(landingUnit, true)
        },
        no: () => {
          decision = 'no'
        }
      }
    })


    return true
  }

  const update = currentTime => {
    if (unloadingStartedAt) {
      const progress = (currentTime - unloadingStartedAt) / Time.UNLOAD_TIME
      const position = LA.lerp(coords, transport.mapCoordinates, progress)
      Unit.update.mapCoordinates(landingUnit, position)
      return currentTime < unloadingStartedAt + Time.UNLOAD_TIME
    }

    if (!decision) {
      return true
    }

    if (decision === 'no') {
      return false
    }

    if (decision === 'yes') {
      Events.trigger('disembark')
      unloadingStartedAt = currentTime
      return true
    }
  }

  const finished = () => {
    if (decision === 'yes') {
      Unit.unloadUnit(unit, Tile.closest(coords), landingUnit)
    }
  }

  const save = () => ({
    module: 'Unload',
    decision,
    unloadingStartedAt,
    coords,
    unit: Record.reference(unit),
    landingUnit: Record.reference(landingUnit),
  })

  return {
    update,
    finished,
    init,
    save,
    priority: true,
    state: {
      info: {
        id: 'unload',
        display: 'Unloading unit',
      },
    },
  }
}

const load = data => {
  const unit = Record.dereference(data.unit)
  if (data.decision === null) {
    return create(unit, data.coords)
  }
  // TODO: What is going on here?
  if (data.decision === 1) {
    // return Commander.cancel()
  }
  if (data.decision === 2 && data.unloadingStartedAt) {
    return createUnloadingOnly(data.unloadingStartedAt)
  }
}

export default {
  create,
  load,
}
