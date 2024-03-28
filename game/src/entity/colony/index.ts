import type { ColonistEntity } from 'ui/overlay/colony/ColonistSummary'
import type { BuildingEntity } from 'view/colony/buildings'
import type { Coordinates } from 'util/la'
import type { UnitEntity } from 'ui/overlay/Unit'
import type { CleanupExec } from 'util/types'

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
import chain from 'entity/colony/chain'
import initialize from 'entity/colony/initialize'

type OwnerEntity = {}

type StorageEntity = {}
type LayoutEntity = number[][]
type ConstructionTarget = {
  progress: number
  cost: StorageEntity,
  display: string
}
type ConstructionEntity = {
  [key: string]: ConstructionTarget | undefined
  none: ConstructionTarget
}



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
  constructionTarget: string | null
  newBuildings: BuildingEntity[]
  layout: LayoutEntity

  productionRecord: StorageEntity
  productionSummary: StorageEntity
  disbanded: boolean
  destroy: CleanupExec
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
    disbanded: false,
    destroy: null
  }
  colony.waterMap = Layout.placeWater(colony)
  colony.newBuildings.push(Buildings.carpenters.create(colony))

  const tile = MapEntity.tile(coords)
  Tile.update.colony(tile, colony)

  initialize(colony)

  Record.add('colony', colony)
  return colony
}

export default {
  add,
  create,
  listen,
  listenEach,
  chain,
  remove,
  update,
  canFillEquipment: Fn.canFillEquipment,
  addBuilding: Fn.addBuilding,
  disband: Fn.disband,
  expertLevel: Fn.expertLevel,
  load: Fn.load,
  save: Fn.save,
  isReachable: Fn.isReachable,
}
