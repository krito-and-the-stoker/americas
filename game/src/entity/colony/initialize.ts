import type { ColonyEntity } from "."

import Signal from 'util/signal-ts'
import Util from 'util/util'
import Events from 'util/events'

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

import chain from './chain'

import { listenEach, update } from './binding'

import Fn from './functions'

export default (colony: ColonyEntity) => {
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

    Signal.connect(
      Signal.emit(colony),
      Signal.combine(
        Signal.listen.key('colonists'),
        Signal.chain(
          Signal.listen.key('newBuildings'),
          Signal.select(buildings => buildings.filter(building => building.name === 'house')),
          Signal.select(buildings => buildings.length)
        )
      ),
      Signal.effect(([colonists, houses]) => {
        if (colonists.length > houses) {
          Fn.addBuilding(colony, 'house', 0)
        }
      })
    ),

    Signal.connect(
      Signal.emit(colony),
      chain.rebels,
      Signal.effect(rebels =>
        Time.schedule(Bells.create(colony, 'bells', rebels))
      )
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

    Time.schedule(TeachingSummary.create(colony)),
    Time.schedule(TransferCrosses.create(colony)),

    Signal.connect(
      Signal.emit(colony),
      chain.currentConstruction,
      Signal.assert.isNothing(
        Signal.effect(() => Construction.start(colony, null)),
        Signal.stop()
      ),
      Signal.passIf(construction => construction.progress > 0),
      Signal.passIf(construction => construction.progress >= Util.sum(Object.values(construction.cost))),
      Signal.effect(construction => {
        Construction.construct(colony, construction)
      })
    ),

    Signal.connect(
      Signal.emit(colony),
      Signal.listen.key('growth'),
      Signal.passIf(growth => growth >= 1000),
      Signal.effect(() => {
        const unit = Unit.create('settler', colony.mapCoordinates, colony.owner)
        const parents = Util.choose(colony.colonists)
        Unit.update.expert(unit, parents.unit.expert)
        Events.trigger('notification', { type: 'born', colony, unit })
        colony.growth = 0
      })
    ),

    Time.schedule(VirtualGoods.create(colony)),
    Time.schedule(ProductionSummary.create(colony)),
    Signal.connect(
      Signal.emit(colony),
      Signal.combine(
        chain.rebelPercentage,
        chain.tories
      ),
      Signal.select(
        ([rebelPercentage, tories]) =>
          Math.floor(rebelPercentage / 50.0) -
          Math.floor(tories / 10.0)
      ),
      Signal.effect(bonus => {
        if (colony.productionBonus !== bonus) {
          update.productionBonus(colony, bonus)
        }
      })
    ),
  ]
}
