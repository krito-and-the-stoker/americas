import type { BuildingEntity } from 'view/colony/buildings'
import type { Coordinates } from 'util/la'
import Record from 'util/record'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'

import Owner from 'entity/owner'
import Construction from 'entity/construction'
import Buildings from 'entity/buildings'
import Layout from 'entity/layout'

import { add, listen, listenEach, update, remove } from 'entity/colony/binding'
import Fn from 'entity/colony/functions'

type OwnerEntity = any
type UnitEntity = any
type ColonistEntity = any
type StorageEntity = any
type LayoutEntity = number[][]
type ConstructionEntity = any | null



export type ColonyEntity = {
  name: string
  type: string
  owner: OwnerEntity
  units: UnitEntity[]
  colonists: ColonistEntity[]
  mapCoordinates: Coordinates
  storage: StorageEntity
  trade: StorageEntity
  waterMap: LayoutEntity
  productionBonus: number
  bells: number
  crosses: number
  housing: number
  growth: number
  supportedUnits: UnitEntity[]
  construction: ConstructionEntity
  constructionTarget: ConstructionEntity
  newBuildings: BuildingEntity[]
  layout: LayoutEntity

  productionRecord: StorageEntity
  productionSummary: StorageEntity
  disbanded: boolean
}



const create = (coords: Coordinates, owner: OwnerEntity) => {
  const colony: ColonyEntity = {
    name: Fn.getColonyName(),
    type: 'colony',
    owner: owner || Owner.player(),
    units: [],
    colonists: [],
    mapCoordinates: { ...coords },
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

    storage: Storage.create,
    trade: Storage.create,

    waterMap: Layout.create(),

    productionRecord: Storage.createWithProduction(),
    productionSummary: Storage.createWithProduction(),
    disbanded: false
  }
  colony.waterMap = Layout.placeWater(colony)
  colony.newBuildings.push(Buildings.carpenters.create(colony))

  const tile = MapEntity.tile(coords)
  Tile.update.colony(tile, colony)

  Fn.initialize(colony)

  Record.add('colony', colony)
  return colony
}

export default {
  add,
  create,
  listen,
  listenEach,
  remove,
  update,
  canFillEquipment: Fn.canFillEquipment,
  coastalDirection: Fn.coastalDirection,
  addBuilding: Fn.addBuilding,
  currentConstruction: Fn.currentConstruction,
  defender: Fn.defender,
  disband: Fn.disband,
  expertLevel: Fn.expertLevel,
  isCoastal: Fn.isCoastal,
  load: Fn.load,
  tile: Fn.tile,
  protection: Fn.protection,
  rebels: Fn.rebels,
  save: Fn.save,
  tories: Fn.tories,
  isReachable: Fn.isReachable,
}
