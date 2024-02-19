import Colony from 'data/colony'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import Member from 'util/member'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Building from 'entity/building'
import Trade from 'entity/trade'
import Owner from 'entity/owner'
import Construction from 'entity/construction'

import Harvest from 'task/colonist/harvest'
import Consume from 'task/colony/consume'
import FillStorage from 'task/colonist/fillStorage'
import Consumption from 'task/colonist/consume'
import SortByPower from 'task/colonist/sortByPower'
import Promote from 'task/colonist/promote'
import ColonyProduction from 'task/colony/colonyProduction'
import ProductionSummary from 'task/colony/productionSummary'
import TeachingSummary from 'task/colonist/teachingSummary'
import TransferCrosses from 'task/europe/transferCrosses'

import UnjoinColony from 'interaction/unjoinColony'
import LeaveColony from 'interaction/leaveColony'

const getColonyName = () => {
  if (!Record.getGlobal('colonyNames')) {
    Record.setGlobal('colonyNames', Colony.names)
  }

  let colonyNames = Record.getGlobal('colonyNames')
  const name = colonyNames.shift()
  Record.setGlobal('colonyNames', colonyNames)
  return name
}

const isCoastal = colony => {
  const center = tile(colony)
  return Tile.radius(center).some(tile => tile.domain === 'sea')
}

const defender = colony => colony.colonists[colony.colonists.length - 1].unit

const currentConstruction = colony =>
  colony.constructionTarget
    ? colony.construction[colony.constructionTarget]
    : colony.construction.none

const add = {
  unit: (colony, unit) => Member.add(colony, 'units', unit),
  colonist: (colony, colonist) => Member.add(colony, 'colonists', colonist),
}

const remove = {
  unit: unit => Member.remove(unit.colony, 'units', unit),
  colonist: colonist => Member.remove(colonist.colony, 'colonists', colonist),
}

const listen = {
  units: (colony, fn) => Binding.listen(colony, 'units', fn),
  colonists: (colony, fn) => Binding.listen(colony, 'colonists', fn),
  construction: (colony, fn) => Binding.listen(colony, 'construction', fn),
  constructionTarget: (colony, fn) => Binding.listen(colony, 'constructionTarget', fn),
  bells: (colony, fn) => Binding.listen(colony, 'bells', fn),
  growth: (colony, fn) => Binding.listen(colony, 'growth', fn),
  buildings: (colony, fn) => Binding.listen(colony, 'buildings', fn),
  productionBonus: (colony, fn) => Binding.listen(colony, 'productionBonus', fn),
  supportedUnits: (colony, fn) => Binding.listen(colony, 'supportedUnits', fn),
}

const listenEach = {
  units: (colony, fn) => Member.listenEach(colony, 'units', fn),
}

const update = {
  construction: (colony, value) => Binding.update(colony, 'construction', value),
  constructionTarget: (colony, value) => Binding.update(colony, 'constructionTarget', value),
  buildings: (colony, value) => Binding.update(colony, 'buildings', value),
  bells: (colony, value) => Binding.update(colony, 'bells', colony.bells + value),
  crosses: (colony, value) => Binding.update(colony, 'crosses', colony.crosses + value),
  housing: (colony, value) => Binding.update(colony, 'housing', colony.housing + value),
  growth: (colony, value) => Binding.update(colony, 'growth', colony.growth + value),
  productionBonus: (colony, value) => Binding.update(colony, 'productionBonus', value),
  supportedUnits: (colony, value) => Binding.update(colony, 'supportedUnits', value),
}

const tories = colony => {
  const colonists = colony.colonists.length
  const administrators = colony.colonists.filter(
    colonist => colonist.work.type === 'Building' && colonist.work.building === 'townhall'
  ).length

  const percentage = Math.max(
    0,
    Math.round(
      100 -
        (100.0 * administrators) / colonists -
        Math.min(100, colony.bells / (colonists + 1))
    )
  )
  const number = Math.max(0, Math.round((colonists * percentage) / 100))

  return {
    percentage,
    number,
  }
}

const rebels = colony => {
  const tt = tories(colony)
  return {
    percentage: 100 - tt.percentage,
    number: colony.colonists.length - tt.number,
  }
}

const tile = colony => MapEntity.tile(colony.mapCoordinates)

const expertLevel = {
  farmer: 1,
  fisher: 1,
  sugarplanter: 1,
  tobaccoplanter: 1,
  cottonplanter: 1,
  furtrapper: 1,
  lumberjack: 1,
  oreminer: 1,
  silverminer: 1,
  distiller: 2,
  tobacconist: 2,
  weaver: 2,
  furtrader: 2,
  blacksmith: 2,
  gunsmith: 2,
  carpenter: 2,
  statesman: 3,
  preacher: 3,
}
const canTeach = (colony, expert) =>
  expert && expertLevel[expert] && expertLevel[expert] <= colony.buildings.school.level
const canEmploy = (colony, building, expert) =>
  colony.colonists.filter(colonist => colonist.work && colonist.work.building === building)
    .length < Building.workspace(colony, building) &&
  (building !== 'school' || canTeach(colony, expert))

const initialize = colony => {
  colony.productionSummary = Storage.createWithProduction()
  colony.productionRecord = Storage.createWithProduction()
  const tile = MapEntity.tile(colony.mapCoordinates)

  if (tile.harvestedBy === colony) {
    Tile.update.harvestedBy(tile, null)
  }

  colony.destroy = [
    Time.schedule(FillStorage.create(colony)),
    Time.schedule(Consumption.create(colony)),
    Time.schedule(Promote.create(colony)),
    Time.schedule(SortByPower.create(colony)),
    listen.colonists(colony, colonists =>
      listen.bells(
        colony,
        Binding.map(
          () => rebels(colony).number,
          rebelColonists => Time.schedule(Consume.create(colony, 'bells', rebelColonists))
        )
      )
    ),
    listenEach.units(colony, (unit, added) => {
      if (added && unit.treasure) {
        Events.trigger('notification', {
          type: 'treasure',
          colony,
          unit,
        })
      }
    }),
    Time.schedule(TeachingSummary.create(colony)),
    Time.schedule(TransferCrosses.create(colony)),
    listen.construction(colony, () => {
      const construction = currentConstruction(colony)
      if (!construction) {
        // repair
        Construction.start(colony, null)
        return
      }
      if (
        construction.progress > 0 &&
        construction.progress >= Util.sum(Object.values(construction.cost))
      ) {
        Construction.construct(colony, construction)
      }
    }),
    listen.growth(colony, growth => {
      if (growth > 1000) {
        const unit = Unit.create('settler', colony.mapCoordinates, colony.owner)
        const parents = Util.choose(colony.colonists)
        Unit.update.expert(unit, parents.expert)
        Events.trigger('notification', { type: 'born', colony, unit })
        colony.growth = 0
      }
    }),
    Time.schedule(ColonyProduction.create(colony)),
    Time.schedule(ProductionSummary.create(colony)),
    listen.colonists(colony, colonists =>
      colonists.map(colonist =>
        Colonist.listen.work(colonist, () =>
          listen.bells(colony, () => {
            const bonus =
              Math.floor(rebels(colony).percentage / 50.0) -
              Math.floor(tories(colony).number / 10.0)

            if (colony.productionBonus !== bonus) {
              update.productionBonus(colony, bonus)
            }
          })
        )
      )
    ),
  ]
}

const canFillEquipment = (colony, unit) => {
  if (unit.properties.repair) {
    return Object.entries(unit.properties.repair).every(
      ([building, level]) => colony.buildings[building]?.level >= level
    )
  }

  return true
}

const create = (coords, owner) => {
  const colony = {
    name: getColonyName(),
    type: 'colony',
    owner: owner || Owner.player(),
    units: [],
    colonists: [],
    buildings: Building.create(),
    construction: Construction.create(),
    constructionTarget: null,
    mapCoordinates: { ...coords },
    productionBonus: 0,
    bells: 0,
    crosses: 0,
    housing: 0,
    growth: 0,
    supportedUnits: [],
  }
  colony.storage = Storage.create()
  colony.trade = Storage.create()

  const tile = MapEntity.tile(coords)
  Tile.update.colony(tile, colony)

  initialize(colony)

  Record.add('colony', colony)
  return colony
}

const protection = colony =>
  (Util.max(
    colony.units
      .filter(unit => unit.domain === 'land')
      .filter(unit => !unit.colonist || !unit.colonist.colony)
      .map(unit => Unit.strength(unit) - 1)
  ) +
    1) *
  (colony.buildings.fortifications.level + 1)

const disband = colony => {
  colony.disbanded = true
  colony.colonists.forEach(UnjoinColony)
  colony.units.forEach(LeaveColony)
  const tile = MapEntity.tile(colony.mapCoordinates)
  Tile.update.colony(tile, null)
  Tile.removeRoad(tile)
  Util.execute(colony.destroy)
  Tile.update.harvestedBy(tile, null)

  Record.remove(colony)
}

const save = colony => ({
  name: colony.name,
  units: colony.units.map(unit => Record.reference(unit)),
  colonists: colony.colonists.map(colonist => Record.reference(colonist)),
  mapCoordinates: colony.mapCoordinates,
  storage: Storage.save(colony.storage),
  trade: Trade.save(colony.trade),
  buildings: colony.buildings,
  construction: Construction.save(colony.construction),
  constructionTarget: colony.constructionTarget,
  bells: colony.bells,
  crosses: colony.crosses,
  housing: colony.housing,
  growth: colony.growth,
  owner: Record.reference(colony.owner),
})

const load = colony => {
  colony.type = 'colony'

  const tile = MapEntity.tile(colony.mapCoordinates)
  tile.colony = colony
  colony.storage = Storage.load(colony.storage)
  colony.trade = Trade.load(colony.trade)
  colony.owner = Record.dereference(colony.owner)
  colony.construction = Construction.load(colony.construction)
  colony.supportedUnits = []


  // legacy games load
  if (!colony.growth) {
    colony.growth = 0
  }
  if (!colony.crosses) {
    colony.crosses = 0
  }
  if (!colony.housing) {
    colony.housing = 0
  }

  colony.colonists.forEach((colonist, index) =>
    Record.dereferenceLazy(colonist, entity => (colony.colonists[index] = entity))
  )
  colony.units.forEach((unit, index) =>
    Record.dereferenceLazy(unit, entity => (colony.units[index] = entity))
  )
  Record.entitiesLoaded(() => initialize(colony))

  return colony
}

const coastalDirection = colony => {
  const center = MapEntity.tile(colony.mapCoordinates)
  const winner = Tile.diagonalNeighbors(center)
    .filter(neighbor => neighbor.coast)
    .map(neighbor => ({
      score:
        Tile.diagonalNeighbors(neighbor).filter(
          nn => nn.coast && Tile.diagonalNeighbors(center).includes(nn)
        ).length + 1,
      tile: neighbor,
    }))
    .reduce((winner, { tile, score }) => (winner.score > score ? winner : { tile, score }), {
      score: 0,
    })

  return winner.score > 0 ? Tile.neighborString(center, winner.tile) : null
}

const isReachable = (colony, unit) =>
  Tile.closest(colony.mapCoordinates)?.area[unit.properties.travelType] === Unit.area(unit) ||
  Tile.diagonalNeighbors(MapEntity.tile(colony.mapCoordinates)).some(
    other => Tile.movementCost(other.mapCoordinates, colony.mapCoordinates, unit) !== Infinity
  )

export default {
  add,
  canFillEquipment,
  canEmploy,
  coastalDirection,
  create,
  currentConstruction,
  defender,
  disband,
  expertLevel,
  isCoastal,
  listen,
  listenEach,
  load,
  tile,
  protection,
  rebels,
  remove,
  save,
  tories,
  isReachable,
  update,
}
