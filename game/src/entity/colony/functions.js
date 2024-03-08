import Colony from 'data/colony'

import Util from 'util/util'
import Record from 'util/record'
import Binding from 'util/binding'
import Member from 'util/member'
import Events from 'util/events'
import Message from 'util/message'

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
import Buildings from 'entity/buildings'
import Layout from 'entity/layout'

import Harvest from 'task/colonist/harvest'
import Bells from 'task/colony/bells'
import FillStorage from 'task/colonist/fillStorage'
import Consume from 'task/colonist/consume'
import SortByPower from 'task/colonist/sortByPower'
import Promote from 'task/colonist/promote'
import VirtualGoods from 'task/colony/virtualGoods'
import ProductionSummary from 'task/colony/productionSummary'
import TeachingSummary from 'task/colonist/teachingSummary'
import TransferCrosses from 'task/europe/transferCrosses'

import UnjoinColony from 'interaction/unjoinColony'
import LeaveColony from 'interaction/leaveColony'

import { listen, listenEach, update } from './binding'

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

const tories = colony => {
  const colonists = colony.colonists.length
  const administrators = colony.colonists.filter(
    colonist => colonist.work?.type === 'Building' && colonist.work.building?.name === 'townhall'
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
  expert && expertLevel[expert] && expertLevel[expert] <= Building.level(colony, 'school')

const initialize = colony => {
  colony.productionSummary = Storage.createWithProduction()
  colony.productionRecord = Storage.createWithProduction()
  const tile = MapEntity.tile(colony.mapCoordinates)

  if (tile.harvestedBy === colony) {
    Tile.update.harvestedBy(tile, null)
  }

  colony.destroy = [
    () => colony.newBuildings.forEach(building => Util.execute(building.destroy)),
    Time.schedule(FillStorage.create(colony)),
    Time.schedule(Consume.create(colony)),
    Time.schedule(Promote.create(colony)),
    Time.schedule(SortByPower.create(colony)),
    listen.colonists(colony, colonists =>
      listen.newBuildings(colony, newBuildings => {
        if (colonists.length > newBuildings.filter(building => building.name === 'house').length) {
          addBuilding(colony, 'house', 0)
        }
      })),
    listen.colonists(colony, colonists =>
      listen.bells(
        colony,
        Binding.map(
          () => rebels(colony).number,
          rebelColonists => Time.schedule(Bells.create(colony, 'bells', rebelColonists))
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
    Time.schedule(VirtualGoods.create(colony)),
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
      ([building, level]) => Building.level(colony, building) >= level
    )
  }

  return true
}


const protection = colony =>
  (Util.max(
    colony.units
      .filter(unit => unit.domain === 'land')
      .filter(unit => !unit.colonist || !unit.colonist.colony)
      .map(unit => Unit.strength(unit) - 1)
  ) +
    1) *
  (Building.level(colony, 'fortifications') + 1)

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

const addBuilding = (colony, name, level = 1) => {
  const building = Buildings[name]?.create(colony, level)
  colony.newBuildings.push(building)
  update.newBuildings(colony)
}

const save = colony => ({
  name: colony.name,
  units: colony.units.map(unit => Record.reference(unit)),
  colonists: colony.colonists.map(colonist => Record.reference(colonist)),
  mapCoordinates: colony.mapCoordinates,
  storage: Storage.save(colony.storage),
  trade: Trade.save(colony.trade),
  newBuildings: colony.newBuildings.map(building => Record.reference(building)),
  layout: Layout.save(colony.layout),
  waterMap: Layout.save(colony.waterMap),
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
  Message.colony.log('Loading colony', colony)

  const tile = MapEntity.tile(colony.mapCoordinates)
  tile.colony = colony
  colony.storage = Storage.load(colony.storage)
  colony.trade = Trade.load(colony.trade)
  colony.owner = Record.dereference(colony.owner)
  colony.construction = Construction.load(colony.construction)
  if (!colony.construction[colony.constructionTarget]) {
    colony.constructionTarget = null
  }
  colony.supportedUnits = []
  colony.layout = colony.layout ? Layout.load(colony.layout) : Layout.create()
  colony.waterMap = colony.waterMap ? Layout.load(colony.waterMap) : Layout.create()
  
  colony.newBuildings = colony.newBuildings.map(building => Record.dereference(building))

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
  canFillEquipment,
  coastalDirection,
  addBuilding,
  currentConstruction,
  defender,
  disband,
  expertLevel,
  isCoastal,
  listenEach,
  load,
  tile,
  protection,
  rebels,
  save,
  tories,
  isReachable,
  initialize,
  getColonyName,
}
