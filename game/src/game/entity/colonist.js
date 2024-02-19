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
import Produce from 'task/colonist/manufacture'
import ProductionSummary from 'task/colony/productionSummary'

import UnjoinColony from 'interaction/unjoinColony'

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
      Util.range(Building.workspace(colonist.colony, building))
    )
    .find(() => true)

  const stop =
    building === 'school'
      ? null
      : Time.schedule(Produce.create(colonist.colony, building, colonist))
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

const listen = {
  work: (colonist, fn) => Binding.listen(colonist, 'work', fn),
  state: (colonist, fn) => Binding.listen(colonist, 'state', fn),
  colony: (colonist, fn) => Binding.listen(colonist, 'colony', fn),
  unit: (colonist, fn) => Binding.listen(colonist, 'unit', fn),
  promotion: (colonist, fn) => Binding.listen(colonist, 'promotion', fn),
  promotionStatus: (colonist, fn) => Binding.listen(colonist, 'promotionStatus', fn),
  beingEducated: (colonist, fn) => Binding.listen(colonist, 'beingEducated', fn),
  expert: (colonist, fn) => Unit.listen.expert(colonist.unit, fn), // legacy, will be removed
}
const update = {
  work: (colonist, value) => Binding.update(colonist, 'work', value),
  state: (colonist, value) => Binding.update(colonist, 'state', value),
  colony: (colonist, value) => Binding.update(colonist, 'colony', value),
  unit: (colonist, value) => Binding.update(colonist, 'unit', value),
  promotion: (colonist, value) => Binding.update(colonist, 'promotion', value),
  promotionStatus: (colonist, value) => Binding.update(colonist, 'promotionStatus', value),
  beingEducated: (colonist, value) => Binding.update(colonist, 'beingEducated', value),
  expert: (colonist, value) => Unit.update.expert(colonist.unit, value), // legacy, will be removed
}

const initialize = colonist => {
  // the record will be used to record during production and consumption
  colonist.productionRecord = Storage.createWithProduction()
  colonist.consumptionRecord = Storage.createWithProduction()
  // the summary is a snapshot created at a reasonable time
  // that can always be displayed
  colonist.productionSummary = Storage.createWithProduction()
  colonist.consumptionSummary = Storage.createWithProduction()

  return [
    listen.unit(colonist, unit => {
      if (!unit) {
        disband(colonist)
      }
    }),
    Time.schedule(ProductionSummary.create(colonist)),
  ]
}

const create = unit => {
  const colonist = {
    type: 'colonist',
    unit,
    education: {
      profession: null,
      progress: 0,
    },
    promotion: {},
    power: Math.random(),
    mood: 0,
    work: null,
    beingEducated: false,
    state: {
      noFood: false,
      noWood: false,
      noLuxury: false,
      isPromoting: false,
      hasBonus: false,
    }
  }

  colonist.storage = Storage.create()
  colonist.destroy = initialize(colonist)

  Record.add('colonist', colonist)
  return colonist
}

const expertName = colonist => Units.settler.name[colonist.unit.expert] || 'Settler'
const professionName = profession => Units.settler.name[profession] || 'Settler'

const power = colonist => {
  if (colonist.unit.expert === 'slave') {
    return 0
  }

  const currentProfession = profession(colonist)
  return Math.max((
    colonist.mood +
    colonist.power +
    (colonist.unit.expert === currentProfession ? 1 : 0) +
    (Colonists[currentProfession] || Colonists.default).power +
    (Colonists[colonist.unit.expert] || Colonists.default).power
  ), 0)
}

const profession = colonist => {
  if (!colonist.work) {
    return 'settler'
  }

  if (colonist.work.building === 'school') {
    return 'teacher'
  }

  let currentProfession =
    colonist.work.type === 'Field'
      ? Goods[colonist.work.good].expert
      : Goods[Buildings[colonist.work.building].production.good].expert
  if (currentProfession === 'farmer' && colonist.work.tile.domain === 'sea') {
    currentProfession = 'fisher'
  }

  return currentProfession
}

const production = colonist => {
  return colonist.work.type === 'Building'
    ? Production.production(colonist.colony, colonist.work.building, colonist)
    : {
        good: colonist.work.good,
        amount: Tile.production(colonist.work.tile, colonist.work.good, colonist),
      }
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
        building: colonist.work.building,
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
        if (colonist.work.building !== 'school') {
          colonist.work.stop = Time.schedule(
            Produce.create(colonist.colony, colonist.work.building, colonist)
          )
        }
      }
    }
  })

  return colonist
}

export default {
  create,
  disband,
  save,
  load,
  beginFieldWork,
  beginColonyWork,
  stopWorking,
  power,
  profession,
  expertName,
  professionName,
  production,
  listen,
  update,
}
