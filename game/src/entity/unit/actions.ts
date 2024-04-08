import $ from 'signal-chain'

import UnitData from 'data/units.json'

import Util from 'util/util'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'

import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Europe from 'entity/europe'


import EnterColony from 'interaction/enterColony'
import EnterEurope from 'interaction/enterEurope'

import { UnitEntity } from './types'
import { TileEntity } from 'entity/unit/types'
import { Coordinates } from 'util/la'

import { update, add, remove } from './binding'
import { capacity, hasCapacity } from './chain'


type Target = {
    mapCoordinates: Coordinates

}
export const goTo = (unit: UnitEntity, target?: Target) => {
    if (!target) {
        unit.movement = {
            target: null,
            path: [],
        }

        return
    }

    // set the target to a place we can actually go to
    const path = PathFinder.findPath(unit.mapCoordinates, target.mapCoordinates, unit)
        .map(Tile.get)
        .filter((tile: TileEntity) => !!tile)

    if (path.length > 0) {
        unit.movement = {
            target: path[path.length - 1],
            path,
        }
    }
}


export const updateType = (unit: UnitEntity, name: string) => {
    update.name(unit, name)
    // @ts-expect-error lookup
    update.properties(unit, UnitData[name])
    update.radius(unit, 0)
}

const fn = {
    capacity: $.function(capacity),
    hasCapacity: $.function(
        $.chain(
            $.select<UnitEntity, [UnitEntity, undefined]>((unit: UnitEntity) => ([unit, undefined])),
            hasCapacity
        )
    )
}

type Pack = { good: string, amount: number }
export const loadGoods = (unit: UnitEntity, pack: Pack) => {
    const amount = Math.min(pack.amount, fn.capacity(unit))

    Storage.update(unit.storage, { good: pack.good, amount })
    return amount
}

export const loadUnit = (unit: UnitEntity, passenger: UnitEntity) => {
    if (!fn.hasCapacity(unit)) {
        return false
    }

    update.vehicle(passenger, unit)
    update.isBoarding(passenger, false)
    add.passenger(unit, passenger)
    return true
}

export const unloadUnit = (unit: UnitEntity, tile: TileEntity, desiredPassenger?: UnitEntity) => {
    if (unit.passengers.length > 0) {
        const passenger = unit.passengers.find(p => p === desiredPassenger) || unit.passengers[0]
        passenger.movement.target = tile
        remove.passenger(passenger)
        update.mapCoordinates(passenger, { ...tile.mapCoordinates })
        update.tile(passenger, tile)
        update.offTheMap(passenger, unit.offTheMap)
        update.vehicle(passenger, null)
        update.isBoarding(passenger, false)
        if (tile.colony) {
            EnterColony(tile.colony, passenger)
        }
        if (Europe.has.unit(unit)) {
            EnterEurope(passenger)
        }

        return passenger
    }

    Message.unit.warn('could not unload, no units on board', unit)
    return null
}

export const unloadAllUnits = (unit: UnitEntity, tile?: TileEntity) => {
    // do not iterate over the cargo array directly because unloadUnit changes it
    Util.range(unit.passengers.length).forEach(() => unloadUnit(unit, tile || unit.tile || Tile.closest(unit.mapCoordinates)))
}


