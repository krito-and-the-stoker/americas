import type { ColonyEntity, OwnerEntity } from 'entity/colony/types'
import type { Coordinates } from 'util/la'
import { CleanupExec, Function1 } from 'util/types'

type CommandInfo = {
    id: string
    display: string
}
export type TileEntity = {
    colony: ColonyEntity
    settlement: boolean
    road: boolean
    forest: boolean
    plowed: boolean
    mountain: boolean
    hills: boolean
    mapCoordinates: Coordinates
    domain: 'land' | 'sea'
}

type CommanderEntity = {
    save: Function1<void, any>
    state: {
        info: CommandInfo
    }
}
type StorageEntity = {
    [key: string]: number
}
type ColonistEntity = {
    colony?: ColonyEntity
}

export type UnitEntity = {
    name: string
    offTheMap: boolean
    colony: ColonyEntity | null
    vehicle: UnitEntity | null
    pioneering: boolean
    owner: OwnerEntity
    radius: number
    isBoarding: boolean
    movement: {
        target: TileEntity | null
        path?: TileEntity[]
    }
    passengers: UnitEntity[]
    domain: string
    commander: CommanderEntity
    command: CommandInfo | null
    storage: StorageEntity
    equipment: StorageEntity
    consumptionSummary: StorageEntity
    consumptionRecord: StorageEntity
    treasure: number | null
    mapCoordinates: Coordinates
    tile?: TileEntity
    colonist: ColonistEntity | null
    expert: string | null
    disbanded: boolean
    properties: {
        travelType: string
        radius?: number
        cost?: number
        speed: number
        canFound?: boolean
        canTerraform?: boolean
        needsFood?: boolean
        cargo?: number
        equipment?: StorageEntity
        combat?: number
        support?: number
        colonyDefense?: number
        canJoin?: boolean
        demote?: string
        promote?: string[]
        canExplore?: boolean
        discoverRange?: number
        name: {
            default: string
            [key: string]: string
        }

    }

    destroy: CleanupExec
}
