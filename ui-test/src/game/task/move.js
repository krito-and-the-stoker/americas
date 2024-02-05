import LA from 'util/la'
import Message from 'util/message'
import PathFinder from 'util/pathFinder'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import Unit from 'entity/unit'
import MapEntity from 'entity/map'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'

const getPath = unit => {
  if (!unit.movement.path || unit.movement.path.length === 0) {
    if (!unit.movement.target) {
      unit.movement.target = unit.tile || Tile.closest(unit.mapCoordinates)
    }
    unit.movement.path = PathFinder.findPath(
      unit.mapCoordinates,
      unit.movement.target.mapCoordinates,
      unit
    )
      .map(coords => Tile.get(coords))
      .filter(tile => !!tile)
  }

  return unit.movement.path
}
const getNextTarget = unit => {
  // unit already at target or without target
  if (!unit.movement.target || unit.tile === unit.movement.target) {
    return unit.movement.target
  }

  // no next target set, get one
  if (!unit.movement.nextTarget) {
    unit.movement.nextTarget = getPath(unit).shift()
  }

  // next target reached, get next one
  if (unit.movement.nextTarget === unit.tile) {
    unit.movement.nextTarget = getPath(unit).shift()
  }

  // filter empty path tiles
  if (!unit.movement.nextTarget) {
    return getNextTarget(unit)
  }

  // next target too far away
  const distance = LA.distanceManhatten(unit.mapCoordinates, unit.movement.nextTarget)
  if (distance > 1) {
    // recalculate
    unit.movement.path = null
    unit.movement.nextTarget = null
    return getNextTarget(unit)
  }

  return unit.movement.nextTarget
}

const moveUnit = (unit, direction, deltaTime) => {
  const normDirection = LA.normalizeManhatten(direction)
  const movementCost = Tile.unitMovementCost(unit)
  const speed = Unit.speed(unit)
  const progress = (deltaTime * speed) / (movementCost * Time.MOVE_BASE_TIME)
  const usedProgress = Math.min(LA.distanceManhatten(direction), progress)
  if (isNaN(movementCost)) {
    console.warn('movementcost is NaN. This is an error and must be investigated.', unit)
    Unit.update.mapCoordinates(
      unit,
      LA.madd(unit.mapCoordinates, (deltaTime * speed) / Time.MOVE_BASE_TIME, normDirection)
    )
  } else {
    // move
    Unit.update.mapCoordinates(unit, LA.madd(unit.mapCoordinates, usedProgress, normDirection))
  }

  // leave tile / colony
  if (unit.tile && unit.tile.mapCoordinates !== unit.mapCoordinates) {
    Unit.update.tile(unit, null)
    if (unit.colony) {
      LeaveColony(unit)
    }
  }

  return progress - usedProgress
}

const sanitizeUnitPosition = (unit, deltaTime) => {
  if (MapEntity.tile(unit.mapCoordinates)) {
    return
  }

  const allBadCoords = [
    { x: 0, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
  ]
    .map(offset => LA.piecewise(LA.add(unit.mapCoordinates, offset), Math.floor))
    .filter(
      coords =>
        Tile.tileMovementCost(MapEntity.tile(coords), unit.properties.travelType) === Infinity
    )

  if (allBadCoords.length === 4) {
    Message.warn('Unit is stuck and therefor removed', unit)
    Unit.disband(unit)
  }

  allBadCoords.forEach(badCoords => {
    const displacement = LA.subtract(badCoords, unit.mapCoordinates)
    Unit.update.mapCoordinates(
      unit,
      LA.madd(unit.mapCoordinates, -deltaTime / Time.MOVE_BASE_TIME, displacement)
    )
  })
}

const create = unit => {
  const update = (_, deltaTime) => {
    if (unit.vehicle || unit.offTheMap) {
      return true
    }

    sanitizeUnitPosition(unit, deltaTime)

    let target = getNextTarget(unit)
    if (!target) {
      return true
    }

    if (
      unit.tile === target &&
      LA.distanceManhatten(unit.mapCoordinates, target.mapCoordinates) === 0
    ) {
      return true
    }

    // already at next target, move to the next after that
    // TODO: if the next target is final target this crashes
    if (LA.distanceManhatten(target.mapCoordinates, unit.mapCoordinates) === 0) {
      unit.movement.nextTarget = null
      target = getNextTarget(unit)
    }

    const direction = LA.subtract(target.mapCoordinates, unit.mapCoordinates)
    const progressLeft = moveUnit(unit, direction, deltaTime)

    // arrive at next tile
    if (progressLeft > 0) {
      Unit.update.mapCoordinates(unit, target.mapCoordinates)

      unit.movement.nextTarget = null
      const nextTarget = getNextTarget(unit)

      // arrive at final target
      if (target === nextTarget) {
        Unit.update.tile(unit, target)

        if (target.colony) {
          EnterColony(target.colony, unit)
        }
      } else {
        // use the left progress
        const nextDirection = LA.subtract(nextTarget.mapCoordinates, unit.mapCoordinates)
        const nextDirectionLeft = LA.multiply(
          progressLeft,
          LA.normalizeManhatten(nextDirection)
        )

        // move again
        moveUnit(unit, nextDirectionLeft, deltaTime)
      }

      return true
    }

    return true
  }

  return {
    update,
    priority: true,
  }
}

export default { create, moveUnit }
