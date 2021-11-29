import LA from 'util/la'
import PathFinder from 'util/pathFinder'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import Unit from 'entity/unit'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'

const getPath = unit => {
	if (!unit.movement.path || unit.movement.path.length === 0) {
		if (!unit.movement.target) {
			unit.movement.target = unit.tile || Tile.closest(unit.mapCoordinates)
		}
		unit.movement.path = PathFinder.findPath(unit.mapCoordinates, unit.movement.target.mapCoordinates, unit)
			.map(coords => Tile.get(coords))
			.filter(tile => !!tile)
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

		let target = getNextTarget(unit)
		if (unit.tile === target) {
			return true
		}

		// already at next target, move to the next after that
		// TODO: if the next target is final target this crashes
		if (LA.distanceManhatten(target.mapCoordinates, unit.mapCoordinates) === 0) {
			unit.movement.nextTarget = null
			target = getNextTarget(unit)
		}

		const direction = LA.subtract(target.mapCoordinates, unit.mapCoordinates)
		const normDirection =LA.normalizeManhatten(direction)
		const fromCoords = LA.round(LA.subtract(target.mapCoordinates, normDirection))
		const movementCost = Tile.movementCost(fromCoords, target.mapCoordinates, unit)
		const speed = Unit.speed(unit)
		const progress = deltaTime * speed / (movementCost * Time.MOVE_BASE_TIME)
		if (isNaN(movementCost)) {
			console.warn('movementcost is nan, hell will break lose!', unit, fromCoords, target)
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

		// arrive at next tile
		const distance = LA.distanceManhatten(direction)
		if (distance < progress) {
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
				const nextNormDirection =LA.normalizeManhatten(nextDirection)
				const nextFromCoords = LA.round(LA.subtract(nextTarget.mapCoordinates, nextNormDirection))
				const nextMovementCost = Tile.movementCost(nextFromCoords, nextTarget.mapCoordinates, unit)
				const nextProgress = (progress - distance) * deltaTime * speed / (nextMovementCost * Time.MOVE_BASE_TIME)

				// move again
				Unit.update.mapCoordinates(unit, LA.madd(unit.mapCoordinates, nextProgress, nextNormDirection))
			}

			return true
		}

		return true
	}

	return {
		update,
		priority: true
	}
}

export default { create }