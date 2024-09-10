import $ from 'signal-chain'

import Util from 'util/util'
import Record from 'util/record'

import Building from 'entity/building'
import Tile from 'entity/tile'
import Storage from 'entity/storage'

import { UNIT_FOOD_CAPACITY, PASSENGER_WEIGHT, TRAVEL_EQUIPMENT } from './constants'

import { TileEntity, UnitEntity } from './types'
import { StorageEntity } from 'entity/colonist/types'

type Pack = { good: string; amount: number }

export const isMoving = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('tile'),
        $.chain(
            $.listen.key('movement'),
            $.listen.key('target')
        )
    ),
    $.select(([tile, target]) => tile === target)
)

export const isIdle = $.unique.chain(
    $.select<UnitEntity>(),
    $.listen.key('command'),
    $.maybe.listen.key('id'),
    $.select(id => !id || id === 'idle')
)

export const name = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('expert'),
        $.listen.key('properties'),
    ),
    $.select(([expert, properties]) => expert && properties.name[expert] || properties.name.default)
)

export const capacity = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.chain(
            $.listen.key('properties'),
            $.select(properties => properties.cargo ?? 0)
        ),
        $.chain(
            $.select(unit => unit.storage),
            Storage.signal
        ),
        $.unique.chain(
            $.listen.key('passengers'),
            $.select(passengers => passengers.length * PASSENGER_WEIGHT)
        )
    ),
    $.select(
        ([cargo, storage, passengers]) => cargo - (Storage.total(storage) + passengers)
    )
)

export const hasCapacity = $.unique.chain(
    $.select<[UnitEntity, Pack | undefined]>(),
    $.select(([unit, pack]) => ({ unit, amount: pack ? pack.amount : PASSENGER_WEIGHT })),
    $.sidechain(
        $.select(({ unit }) => unit),
        capacity
    ),
    $.select(([{ amount }, capacity]) => amount <= capacity)
)

export const area = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('domain'),
        $.listen.key('properties'),
        $.chain(
            $.listen.key('movement'),
            $.listen.key('target')
        ),
        $.listen.key('tile'),
        $.chain(
            $.select(unit => unit.mapCoordinates),
            $.select(coords => Tile.closest(coords) as TileEntity)
        )
    ),
    $.select(([domain, properties, target, tile, closest]) => {
        const areaTile = target || tile
        if (domain === areaTile?.domain) {
            return Tile.area(areaTile, properties.travelType)
        }

        return Tile.area(closest, properties.travelType)
    })
)

export const additionalEquipment = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('properties'),
        $.chain(
            $.select(unit => unit.equipment),
            Storage.signal
        ),
    ),
    $.select(([properties, equipment]) => {
        return Storage.goods(equipment)
            .filter(pack => !properties.needsFood || pack.good !== 'food')
            .filter(pack => !properties.equipment || !properties.equipment[pack.good])
    })
)

export const overWeight = $.unique.chain(
    $.select<UnitEntity>(),
    $.select(unit => unit.equipment),
    Storage.signal,
    $.select((equipment: StorageEntity) => {
        const equipmentCapacity = 50 + (equipment.horses ?? 0) + UNIT_FOOD_CAPACITY
        return Math.max((Storage.total(equipment) - equipmentCapacity) / equipmentCapacity, 0)
    })
)


const support = (unit: UnitEntity) =>
  Util.max<UnitEntity>(
    Record.getAll('unit')
      .filter(support => support.properties.support)
      .filter(support => support.owner === unit.owner)
      .filter(support => support !== unit)
      .filter(support => Util.inBattleDistance(support, unit)),
    support => (support.properties.support ?? 0)
  )

export const strength = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('properties'),
        $.chain(
            $.listen.key('colony'),
            $.maybe.chain(
                $.select(colony => colony.storage),
                Storage.signal,
                $.select((storage: StorageEntity) => storage.guns)
            ),
            $.select(guns => guns || 0)
        ),
        // TODO: This select support is not reactive yet
        $.select(support),
        $.unique.chain(
            $.sidechain(
                $.listen.key('colony')
            ),
            $.select(([unit, colony]) => (colony?.owner === unit.owner) ? colony : undefined),
            $.maybe.select(colony => Building.level(colony, 'fortifications') as number)
        ),
        $.listen.key('expert'),
        $.listen.key('name'),
        $.chain(
            $.select(unit => unit.equipment),
            Storage.signal,
        )
    ),
    $.select(([properties, guns, supportUnit, fortifications, expert, name, equipment]) => {
        let result = properties.combat || 0.5
        if (!properties.combat && guns > 0) {
            result += Math.min(guns / 50, 1)
        }

        if (supportUnit) {
            result += supportUnit.properties.support!
        }

        if (fortifications) {
            result += fortifications
            result += (properties.colonyDefense ?? 0)
        }

        if (expert === 'soldier') {
            if (name === 'soldier' || name === 'dragoon') {
                result += 1
            } else {
                result += 0.5
            }
        }

        const requiredEquipment = properties.equipment && Storage.total(properties.equipment) || 0
        if (result > 1 && requiredEquipment > 0 && name !== 'pioneer') {
            result =
                1 +
                (result - 1) *
                    Util.clamp((Storage.total(equipment) - equipment.food) / requiredEquipment)
        }

        return result
    })
)


export const speed = $.unique.chain(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('properties'),
        $.listen.key('expert'),
        $.chain(
            $.select(unit => unit.equipment),
            Storage.signal
        )
    ),
    $.select(([properties, expert, equipment]) => {
        let result = properties.speed

        if (expert === 'scout') {
            result += 1
        }

        const equipmentType = TRAVEL_EQUIPMENT[properties.travelType as keyof typeof TRAVEL_EQUIPMENT]
        if (equipmentType && properties.equipment) {
            const minimalRelation = Math.min(
                ...Storage.goods(equipment).map(pack =>
                    properties.equipment![pack.good] > 0
                        ? equipment[pack.good] / properties.equipment![pack.good]
                        : 1
                )
            )

            result *= Math.max(minimalRelation, 0)
        }

        return result
    })
)

