import type { Coordinates } from 'util/la'
import { ColonistEntity } from 'entity/colonist/types'
import type { BuildingEntity } from 'view/colony/buildings'
import type { UnitEntity } from 'ui/overlay/Unit'
import type { CleanupExec } from 'util/types'


export type OwnerEntity = {}

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
