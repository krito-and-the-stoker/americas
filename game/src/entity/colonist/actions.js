import Colonists from 'data/colonists'
import Units from 'data/units'
import Goods from 'data/goods'
import Buildings from 'data/buildings'

import Record from 'util/record'
import Binding from 'util/binding'
import Util from 'util/util'

import Tile from 'entity/tile'
import Production from 'entity/production'
import Unit from 'entity/unit'
import Building from 'entity/building'
import Storage from 'entity/storage'

import Time from 'timeline/time'

import Harvest from 'task/colonist/harvest'
import Manufacture from 'task/colonist/manufacture'
import ProductionSummary from 'task/colony/productionSummary'

import UnjoinColony from 'interaction/unjoinColony'

import { listen, update } from './binding'
import { initialize } from './colonist'

const beginFieldWork = (colonist, tile, good) => {
  stopWorking(colonist)
  const colony = colonist.colony
  const stop = Time.schedule(Harvest.create(colony, tile, good, colonist))

  update.work(colonist, {
    type: 'Field',
    tile,
    good,
    stop,
  })
}

const beginColonyWork = (colonist, building) => {
  stopWorking(colonist)

  const position = colonist.colony.colonists
    .filter(col => col.work && col.work.building === building)
    .map(col => col.work.position)
    .reduce(
      (free, occupied) => free.filter(pos => pos !== occupied),
      Util.range(Building.workspace(colonist.colony, building.name))
    )
    .find(() => true)

  const stop =
    building.name === 'school'
      ? null
      : Time.schedule(Manufacture.create(colonist.colony, building, colonist))
  update.work(colonist, {
    type: 'Building',
    building,
    position,
    stop,
  })
}

const stopWorking = colonist => {
  if (colonist.work) {
    Util.execute(colonist.work.stop)
    if (colonist.work.tile) {
      Tile.update.harvestedBy(colonist.work.tile, null)
    }
  }
  update.work(colonist, null)
}



const disband = colonist => {
  if (colonist.colony) {
    UnjoinColony(colonist)
  }

  Util.execute(colonist.destroy)

  if (colonist.unit) {
    Unit.update.colonist(colonist.unit, null)
  }

  Record.remove(colonist)
}

const save = colonist => ({
  colony: Record.reference(colonist.colony),
  unit: Record.reference(colonist.unit),
  education: colonist.education,
  power: colonist.power,
  mood: colonist.mood,
  storage: Storage.save(colonist.storage),
  promotion: colonist.promotion,
  state: colonist.state,
  work: colonist.work
    ? {
        type: colonist.work.type,
        good: colonist.work.good,
        building: Record.reference(colonist.work.building),
        position: colonist.work.position,
        tile: Record.referenceTile(colonist.work.tile),
      }
    : null,
})

const load = colonist => {
  colonist.type = 'colonist'

  colonist.colony = Record.dereference(colonist.colony)
  colonist.unit = Record.dereference(colonist.unit)

  // load legacy savegames
  colonist.storage = colonist.storage
    ? Storage.load(colonist.storage)
    : Storage.create()
  colonist.state = colonist.state || {}

  colonist.power = colonist.power || Math.random()
  colonist.mood = colonist.mood || 0
  colonist.promotion = colonist.promotion || {}
  if (colonist.promotion.promote) {
    colonist.promotion = {
      progress: colonist.promotion.promote
    }
  }

  if (colonist.work?.building) {
    colonist.work.building = Record.dereference(colonist.work.building)
  }

  Record.entitiesLoaded(() => {
    initialize(colonist)
    if (colonist.work) {
      if (colonist.work.type === 'Field') {
        colonist.work.tile = Record.dereferenceTile(colonist.work.tile)
        Tile.update.harvestedBy(colonist.work.tile, null)
        colonist.work.stop = Time.schedule(
          Harvest.create(colonist.colony, colonist.work.tile, colonist.work.good, colonist)
        )
      }
      if (colonist.work.type === 'Building') {
        if (colonist.work.building.name !== 'school') {
          colonist.work.stop = Time.schedule(
            Manufacture.create(colonist.colony, colonist.work.building, colonist)
          )
        }
      }
    }
  })

  return colonist
}

export default {
  save,
  load,
  disband,
  beginFieldWork,
  beginColonyWork,
  stopWorking,
}
