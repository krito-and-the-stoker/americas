import type { UnitEntity } from 'ui/overlay/Unit'
import type { ColonyEntity } from 'entity/colony/types'
import type { BuildingEntity } from 'view/colony/buildings'
import { CleanupExec } from 'signal-chain'

export type StorageEntity = {
    [key: string]: number
}

export type TileEntity = {
    domain: 'sea' | 'land'
}

export type ColonistWork = {
    type: 'Building'
    building: BuildingEntity
    position: number
} | {
    type: 'Field',
    good: string
    tile: TileEntity
}

type BreakdownObject<T> = {
    food: T
    wood: T
    luxury: T
    bonus: T
    promotion: T
}

type ConsumptionBreakdown = {
    has: BreakdownObject<StorageEntity>,
    want: BreakdownObject<StorageEntity>,
    state: BreakdownObject<boolean>
}

export type ColonistEntity = {
    work?: ColonistWork
    unit: UnitEntity
    storage: StorageEntity
    colony?: ColonyEntity
    consumptionSummary: StorageEntity
    productionSummary: StorageEntity
    consumptionRecord: StorageEntity
    productionRecord: StorageEntity
    state: {
        noFood: boolean
        noWood: boolean
        noLuxury: boolean
        isPromoting: boolean
        hasBonus: boolean
    },
    consumptionBreakdown: ConsumptionBreakdown
    promotion: {
        target: string
        progress: {
            [key: string]: number
        }
    }
    mood: number
    power: number
    referenceId: number
    destroy: CleanupExec
}
