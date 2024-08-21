import type { Coordinates } from 'util/la'
import { ColonyEntity, OwnerEntity } from './types'


import Record from 'util/record'
import LA from 'util/la'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'

import Owner from 'entity/owner'
import Construction from 'entity/construction'
import Buildings from 'entity/buildings'
import Layout from 'entity/layout'

import initialize from 'entity/colony/initialize'
import Fn from 'entity/colony/functions'




export const create = (coords: Coordinates, owner: OwnerEntity) => {
  const colony: ColonyEntity = {
    name: Fn.getColonyName(),
    type: 'colony',
    owner: owner || Owner.player(),
    units: [],
    colonists: [],
    mapCoordinates: LA.round(coords),
    productionBonus: 0,
    bells: 0,
    crosses: 0,
    housing: 0,
    growth: 0,
    supportedUnits: [],
    construction: Construction.create(),
    constructionTarget: null,

    // yeah
    newBuildings: [],
    layout: Layout.create(),

    storage: Storage.create(),
    trade: Storage.create(),

    waterMap: Layout.create(),

    productionRecord: Storage.createWithProduction(),
    productionSummary: Storage.createWithProduction(),
    disbanded: false,
    destroy: null
  }
  colony.waterMap = Layout.placeWater(colony)
  colony.newBuildings.push(Buildings.carpenters.create(colony))

  const tile = MapEntity.tile(colony.mapCoordinates)
  Tile.update.colony(tile, colony)

  initialize(colony)

  Record.add('colony', colony)
  return colony
}

