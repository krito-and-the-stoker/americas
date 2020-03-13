import LA from 'util/la'
import PathFinder from 'util/pathFinder'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import Unit from 'entity/unit'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'

const getPath = unit => {
	if (!unit.movement.path) {
		unit.movement.path = PathFinder.findPath(unit.mapCoordinates, unit.movement.target.mapCoordinates, unit)
			.map(coords => Tile.get(coords))
			.filter(tile => tile)
	}

	return unit.movement.path
}
const getNextTarget = unit => {
	// unit already at target
	if (unit.tile === unit.movement.target) {
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

const create = unit => {
	const update = (currentTime, deltaTime) => {
		if (unit.vehicle || unit.offTheMap) {
			return true
		}

		const target = getNextTarget(unit)
		if (unit.tile === target) {
			return true
		}

		const direction = LA.subtract(target.mapCoordinates, unit.mapCoordinates)
		const normDirection =LA.normalizeManhatten(direction)
		// const fromCoords = LA.round(LA.subtract(target.mapCoordinates, normDirection))
		const movementCost = Tile.movementCost(unit.mapCoordinates, target.mapCoordinates)
		const speed = Unit.speed(unit)
		const progress = deltaTime * speed / (movementCost * Time.MOVE_BASE_TIME)

		// arrive
		if (LA.distance(direction) < progress) {
			unit.mapCoordinates = target.mapCoordinates
			Unit.update.tile(unit, target)

			if (target.colony) {
				EnterColony(target.colony, unit)
			}

			if (unit.properties.canExplore) {			
				Tile.discover(target, unit.owner)
				Tile.diagonalNeighbors(target).forEach(other => Tile.discover(other, unit.owner))
			}

			return true
		}

		// move
		Unit.update.mapCoordinates(unit, LA.madd(unit.mapCoordinates, progress, normDirection))

		// leave tile / colony
		if (unit.tile && unit.tile.mapCoordinates !== unit.mapCoordinates) {
			Unit.update.tile(unit, null)
			if (unit.colony) {
				LeaveColony(unit)
			}
		}

		return true
	}

	return {
		update,
		priority: true
	}
}

export default { create }