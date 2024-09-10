import Util from 'util/util'
import Record from 'util/record'

import Storage from 'entity/storage'
import Tile from 'entity/tile'
import Building from 'entity/building'

import { PASSENGER_WEIGHT, TRAVEL_EQUIPMENT, UNIT_FOOD_CAPACITY } from "./constants"
import { UnitEntity } from "./types"
import { Coordinates } from 'util/la'

type Pack = {
    good: string
    amount: number
}

export const at = (coords: Coordinates) =>
  Record.getAll('unit').filter(
    unit => unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y
  )

export const isIdle = (unit: UnitEntity) => !unit.command || unit.command.id === 'idle'
export const isMoving = (unit: UnitEntity) => unit.tile !== unit.movement.target
export const name = (unit: UnitEntity) =>
  unit.expert
    ? unit.properties.name[unit.expert] || unit.properties.name.default
    : unit.properties.name.default

export const hasCapacity = (unit: UnitEntity, pack?: Pack) => {
  const amount = pack ? pack.amount : PASSENGER_WEIGHT

  return amount <= capacity(unit)
}
export const capacity = (unit: UnitEntity) =>
  (unit.properties.cargo ?? 0) -
  (Storage.total(unit.storage) + unit.passengers.length * PASSENGER_WEIGHT)

export const area = (unit: UnitEntity) => {
  let tile = unit.movement.target || unit.tile || Tile.closest(unit.mapCoordinates)
  if (tile.domain === unit.domain) {
    return Tile.area(tile, unit.properties.travelType)
  }

  tile = Tile.closest(unit.mapCoordinates)
  return Tile.area(tile, unit.properties.travelType)
}

export const additionalEquipment = (unit: UnitEntity) =>
  Storage.goods(unit.equipment)
    .filter(pack => !unit.properties.needsFood || pack.good !== 'food')
    .filter(pack => !unit.properties.equipment || !unit.properties.equipment[pack.good])

export const overWeight = (unit: UnitEntity) => {
  const equipmentCapacity = 50 + unit.equipment.horses + UNIT_FOOD_CAPACITY
  return Math.max((Storage.total(unit.equipment) - equipmentCapacity) / equipmentCapacity, 0)
}

export const support = (unit: UnitEntity) =>
  Util.max(
    Record.getAll('unit')
      .filter(support => support.properties.support)
      .filter(support => support.owner === unit.owner)
      .filter(support => support !== unit)
      .filter(support => Util.inBattleDistance(support, unit)),
    support => support.properties.support
  )

export const strength = (unit: UnitEntity) => {
  let result = unit.properties.combat || 0.5

  if (!unit.properties.combat && unit.colony) {
    result += Math.min(unit.colony.storage.guns / 50, 1)
  }

  const supportUnit = support(unit)
  if (supportUnit) {
    result += supportUnit.properties.support
  }

  if (unit.colony && unit.owner === unit.colony.owner) {
    result += Building.level(unit.colony, 'fortifications')
    if (unit.properties.colonyDefense) {
      result += unit.properties.colonyDefense
    }
  }

  if (unit.expert === 'soldier') {
    if (unit.name === 'soldier' || unit.name === 'dragoon') {
      result += 1
    } else {
      result += 0.5
    }
  }

  const equipment = (unit.properties.equipment && Storage.total(unit.properties.equipment)) ?? 0
  if (result > 1 && equipment > 0 && unit.name !== 'pioneer') {
    result =
      1 +
      (result - 1) *
        Util.clamp((Storage.total(unit.equipment) - unit.equipment.food) / equipment)
  }

  return result
}

export const speed = (unit: UnitEntity) => {
  let result = unit.properties.speed

  if (unit.name === 'scout' && unit.expert === 'scout') {
    result += 1
  }

  const equipment = TRAVEL_EQUIPMENT[unit.properties.travelType as keyof typeof TRAVEL_EQUIPMENT]
  if (equipment && unit.properties.equipment) {
    const minimalRelation = Math.min(
      ...Storage.goods(unit.equipment).map(pack =>
        unit.properties.equipment && unit.properties.equipment[pack.good] > 0
          ? unit.equipment[pack.good] / unit.properties.equipment[pack.good]
          : 1
      )
    )

    result *= Math.max(minimalRelation, 0)
  }

  return result
}