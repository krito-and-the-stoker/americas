import type { ColonyEntity } from "./types"

import $ from 'signal-chain'
import Util from 'util/util'
import Events from 'util/events'
import Record from 'util/record'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Construction from 'entity/construction'

import Bells from 'task/colony/bells'
import FillStorage from 'task/colonist/fillStorage'
import Consume from 'task/colonist/consume'
import SortByPower from 'task/colonist/sortByPower'
import Promote from 'task/colonist/promote'
import VirtualGoods from 'task/colony/virtualGoods'
import ProductionSummary from 'task/colony/productionSummary'
import TeachingSummary from 'task/colonist/teachingSummary'
import TransferCrosses from 'task/europe/transferCrosses'
import Produce from 'task/colony/produce'
import Manufacture from 'task/colonist/manufacture'
import Harvest from 'task/colonist/harvest'

import LeaveColony from 'interaction/leaveColony'

import chain from './chain'

import { listenEach, update } from './binding'

import Fn from './functions'
import { UnitEntity } from "entity/unit/types"

const CACHE_WARM_RATE = 1.0
const warmCache = (colony: ColonyEntity, cacheUnit: UnitEntity | null) => {
  if (cacheUnit) {
    const colonies = Record.getAll('colony')
      .filter(other => other !== colony && Fn.isReachable(other, cacheUnit))
    colonies.forEach(other => {
      if (Math.random() < CACHE_WARM_RATE) {
        PathFinder.distance(
          colony.mapCoordinates,
          other.mapCoordinates,
          cacheUnit
        )
      }
    })
    LeaveColony(cacheUnit)
    Unit.disband(cacheUnit)
  }
}

export default (colony: ColonyEntity) => {
  colony.productionSummary = Storage.createWithProduction()
  colony.productionRecord = Storage.createWithProduction()
  const tile = MapEntity.tile(colony.mapCoordinates)

  if (tile.harvestedBy === colony) {
    Tile.update.harvestedBy(tile, null)
  }

  // warm cache
  Message.cache.log('Warming Cache for', colony.name)
  const cacheCaravel = Unit.create('caravel', colony.mapCoordinates, colony.owner)
  const cacheMerch = Unit.create('merchantman', colony.mapCoordinates, colony.owner)
  // const cacheWagon = Unit.create('wagontrain', colony.mapCoordinates, colony.owner)
  warmCache(colony, cacheCaravel)
  warmCache(colony, cacheMerch)
  // warmCache(colony, cacheWagon)


  colony.destroy = [
    () => colony.newBuildings.forEach(building => Util.execute(building.destroy)),


    Time.schedule(SortByPower.create(colony)), // 1
    Time.schedule(Promote.create(colony)), // 4
    Time.schedule(TeachingSummary.create(colony)),

    Time.schedule(
      TransferCrosses.create(colony),
      VirtualGoods.create(colony),
      Harvest.create(colony),
      Produce.create(colony, 'housing'),
      FillStorage.create(colony),
      Manufacture.create(colony),
      Consume.create(colony),
      Bells.create(colony),
      ProductionSummary.create(colony),
    ),

    $.connect(
      $.emit(colony),
      $.combine(
        $.listen.key('colonists'),
        $.chain(
          $.listen.key('newBuildings'),
          $.select(buildings => buildings.filter(building => building.name === 'house')),
          $.select(buildings => buildings.length)
        )
      ),
      $.effect(([colonists, houses]) => {
        if (colonists.length > houses) {
          Fn.addBuilding(colony, 'house', 0)
        }
      })
    ),


    // TODO: Implement with signals
    listenEach.units(colony, (unit: any, added: boolean) => {
      if (added && unit.treasure) {
        Events.trigger('notification', {
          type: 'treasure',
          colony,
          unit,
        })
      }
    }),

    $.connect(
      $.emit(colony),
      chain.currentConstruction,
      $.type.isNothing(
        $.effect(() => Construction.start(colony, null)),
        $.stop()
      ),
      $.passIf(construction => construction.progress > 0),
      $.passIf(construction => construction.progress >= Util.sum(Object.values(construction.cost))),
      $.effect(construction => {
        Construction.construct(colony, construction)
      })
    ),

    $.connect(
      $.emit(colony),
      $.listen.key('growth'),
      $.passIf(growth => growth >= 1000),
      $.effect(() => {
        const unit = Unit.create('settler', colony.mapCoordinates, colony.owner)
        const parents = Util.choose(colony.colonists)
        Unit.update.expert(unit, parents.unit.expert)
        Events.trigger('notification', { type: 'born', colony, unit })
        colony.growth = 0
      })
    ),

    $.connect(
      $.emit(colony),
      $.combine(
        chain.rebelPercentage,
        chain.tories
      ),
      $.select(
        ([rebelPercentage, tories]) =>
          Math.floor(rebelPercentage / 50.0) -
          Math.floor(tories / 10.0)
      ),
      $.effect(bonus => {
        if (colony.productionBonus !== bonus) {
          update.productionBonus(colony, bonus)
        }
      })
    ),
  ]
}
