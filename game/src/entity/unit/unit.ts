import $ from 'signal-chain'

import Units from 'data/units.json'

import Util from 'util/util'
import Events from 'util/events'
import Record from 'util/record'
import Binding from 'util/binding'
import Message from 'util/message'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Europe from 'entity/europe'
import Colonist from 'entity/colonist'
import Owner from 'entity/owner'
import Colony from 'entity/colony'

import Move from 'task/unit/move'
import PayUnit from 'task/unit/payUnit'
import ConsumeFood from 'task/unit/consumeFood'
import FillFoodStock from 'task/unit/fillFoodStock'
import FillEquipment from 'task/unit/fillEquipment'
import ConsumeEquipment from 'task/unit/consumeEquipment'
import ProductionSummary from 'task/colony/productionSummary'

import Commander from 'command/commander'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'
import Fight from 'interaction/fight'

import Natives from 'ai/natives'

import { Coordinates } from 'util/la'
import { ColonyEntity, OwnerEntity } from 'entity/colony/types'
import { TileEntity, UnitEntity } from './types'

import { update, listen } from './binding'
import { updateType } from './actions'
import { StorageEntity } from 'entity/colonist/types'
import { MINIMAL_EQUPIMENT, RADIUS_GROWTH, UNIT_FOOD_CAPACITY } from './constants'

export const at = (coords: Coordinates) =>
    Record.getAll('unit').filter(
        unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y
    )

export const create = (name: string, coords: Coordinates, owner: OwnerEntity) => {
  if (Units[name]) {
    const unit: UnitEntity = {
      name,
      owner: owner || Owner.player(),
      tile: MapEntity.tile(coords),
      properties: Units[name],
      domain: Units[name].domain,
      mapCoordinates: coords || { x: undefined, y: undefined },
      passengers: [],
      treasure: null,
      vehicle: null,
      colony: null,
      expert: null,
      offTheMap: false,
      colonist: null,
      pioneering: false,
      radius: 0,
      command: null,
      isBoarding: false,
      movement: {
        target: MapEntity.tile(coords),
      },

      storage: Storage.create(),
      equipment: Storage.create(),

      commander: null as any,
      destroy: null,
      disbanded: false,
      consumptionRecord: Storage.createWithProduction(),
      consumptionSummary: Storage.createWithProduction(),
    }

    unit.commander = Commander.create({ keep: true, unit })

    if (unit.properties.canJoin) {
      unit.colonist = Colonist.create(unit)
    }

    unit.equipment.food = unit.properties.needsFood ? UNIT_FOOD_CAPACITY : 0
    if (unit.properties.equipment) {
      Object.entries(unit.properties.equipment).forEach(([good, amount]) => {
        unit.equipment[good] = amount
      })
    }

    if (name === 'slave') {
      unit.expert = 'slave'
    }

    unit.destroy = initialize(unit)

    if (unit.tile && unit.tile.colony) {
      EnterColony(unit.tile.colony, unit)
    }

    Record.add('unit', unit)

    return unit
  } else {
    Message.unit.error('Unit.create: Unit type not found', name)
    return null
  }
}


const canDiscoverNeighbors = (tile: TileEntity) => tile.domain === 'sea' || (
    !tile.forest && !tile.mountain && !tile.hills
)

export const initialize = (unit: UnitEntity) => {
  Util.execute(unit.destroy)

  if (unit.tile) {
    Tile.discover(unit.tile, unit.owner)
    Tile.diagonalNeighbors(unit.tile).forEach(other => Tile.discover(other, unit.owner))
  }

  return [
    Time.schedule(unit.commander),
    Time.schedule(Move.create(unit)),
    Time.schedule(ConsumeEquipment.create(unit)),
    Time.schedule(ProductionSummary.create(unit)),

    $.connect(
      $.emit(unit.commander.state),
      $.listen.key('info'),
      $.effect(info => {
        unit.command = info ? { ...info } : null
      })
    ),

    Time.schedule({
      update: (_: number, deltaTime: number) => {
        if (unit.vehicle || (unit.colonist && unit.colonist.colony)) {
          if (unit.radius > 0) {
            update.radius(unit, 0)
          }
          return true
        }
        if (unit.radius < (unit.properties.radius ?? 0)) {
          const equipmentRatio = unit.properties.equipment
            ? Storage.total(unit.equipment) /
              Util.sum(Object.values(unit.properties.equipment))
            : 1
          update.radius(
            unit,
            Math.min(
              unit.radius + equipmentRatio * RADIUS_GROWTH * deltaTime,
              (unit.properties.radius ?? 0)
            )
          )
        }

        return true
      },
      priority: true,
    }),

    $.connect(
      $.emit(unit),
      $.listen.key('tile'),
      $.effect(tile => tile && Tile.add.unit(tile, unit))
    ),

    // lose status
    $.connect(
      $.emit(unit),
      $.combine(
        $.listen.key('properties'),
        $.chain(
          $.select(unit => unit.equipment),
          Storage.signal
        )
      ),
      $.effect(([properties, equipment]) => {
        if (properties.demote && properties.equipment) {
          const shouldDemote = Object.entries(properties.equipment).some(
            ([good, amount]) => equipment[good] < MINIMAL_EQUPIMENT * amount
          )

          if (shouldDemote) {
            updateType(unit, properties.demote)
          }
        }
      })
    ),

    // gain status
    $.connect(
      $.emit(unit),
      $.combine(
        $.listen.key('properties'),
        $.chain(
          $.select(unit => unit.equipment),
          Storage.signal
        )
      ),
      $.effect(([properties, equipment]) => {
        if (properties.promote) {
          const promoteUnitTo = properties.promote.find(name =>
            Object.entries((Units[name].equipment || {}) as StorageEntity).every(
              ([good, amount]) => equipment[good] >= MINIMAL_EQUPIMENT * amount
            )
          )

          if (promoteUnitTo) {
            updateType(unit, promoteUnitTo)
          }
        }
      })
    ),

    // discover
    listen.properties(
      unit,
      (properties: UnitEntity['properties']) =>
        properties.canExplore && properties.discoverRange &&
        listen.mapCoordinates(
          unit,
          Binding.map(
            coords => Tile.closest(coords),
            center => {
              if (!center) {
                Message.unit.warn('tile is null, this should not be', unit)
                return
              }
              if (properties.discoverRange === 1) {
                Tile.discover(center, unit.owner)
                Tile.diagonalNeighbors(center).forEach(other => setTimeout(
                  () =>Tile.discover(other, unit.owner),
                  Math.random() * 500
                ))
              }
              if (properties.discoverRange! >= 2) {
                Tile.discover(center, unit.owner)
                const tiles = Util.flatten(Tile.diagonalNeighbors(center).map(
                  neighbor => canDiscoverNeighbors(neighbor) ? [neighbor, ...Tile.neighbors(neighbor)] : [neighbor]
                )).filter(Util.unique)

                tiles.forEach(tile => setTimeout(
                  () =>Tile.discover(tile, unit.owner),
                  Math.random() * 500
                ))

                if (properties.discoverRange! > 2) {
                  console.warn('discover range > 2 not implemented yet')
                }
              }
            }
          )
        )
    ),

    listen.properties(unit, () => Time.schedule(PayUnit.create(unit))),

    // eat
    $.connect(
      $.emit(unit),
      $.combine(
        $.listen.key('offTheMap'),
        $.listen.key('properties'),
        $.listen.key('vehicle')
      ),
      $.effect(([offTheMap, properties, vehicle]) => {
        if (!offTheMap && properties.needsFood && !vehicle) {
          return Time.schedule(ConsumeFood.create(unit))
        }
      })
    ),

    // supported colony
    $.connect(
      $.emit(unit),
      $.combine(
        $.select(),
        $.chain(
          $.listen.key('mapCoordinates'),
          $.unique.select(coords => Tile.supportingColony(Tile.closest(coords)) as ColonyEntity | undefined),
        ),
        $.listen.key('properties')
      ),
      $.effect(([unit, colony, properties]) => {
        if (colony) {
          Colony.update.supportedUnits(colony, [...colony.supportedUnits, unit])
          return [
            properties?.needsFood && Time.schedule(FillFoodStock.create(unit, colony)),
            properties?.equipment && Time.schedule(FillEquipment.create(unit, colony)),
            () => {
              Colony.update.supportedUnits(colony, colony.supportedUnits.filter(other => other !== unit))
            }
          ]
        }
      })
    ),

    // auto attack
    Events.listen('meet', ({ unit, other }: any) => {
      if (
        unit.owner.input &&
        unit.properties.canAttack &&
        other &&
        (!other.owner.ai ||
          Natives.seemsHostile(other.owner.ai.state.relations[unit.owner.referenceId])) &&
        unit.domain === other.domain &&
        unit.radius > 0.1 * unit.properties.radius
      ) {
        Message.unit.log('player attacking hostile', unit.name, other.name)
        Fight(unit, other)
      }
    }),
  ]
}

export const disband = (unit: UnitEntity) => {
  if (unit.colony) {
    Storage.goods(unit.equipment).forEach(pack => {
      Storage.transfer(unit.equipment, unit.colony!.storage, {
        good: pack.good,
        amount: pack.amount / 2,
      })
    })
    LeaveColony(unit)
  }
  if (Europe.has.unit(unit)) {
    Europe.remove.unit(unit)
  }
  unit.passengers.forEach(disband)
  Commander.clearSchedule(unit.commander)
  if (unit.colonist) {
    Colonist.update.unit(unit.colonist, null)
  }

  unit.disbanded = true

  Util.execute(unit.destroy)

  Events.trigger('disband', { unit })

  Record.remove(unit)
}