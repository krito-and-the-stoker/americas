import LA from 'util/la'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'


const create = unit => {
	const update = (currentTime, deltaTime) => {
		if (unit.vehicle || unit.offTheMap) {
			return true
		}

		const target = unit.movement.target
		if (unit.tile === target) {
			return true
		}

		const direction = LA.subtract(target.mapCoordinates, unit.mapCoordinates)
		const normDirection =LA.normalizeManhatten(direction)
		const fromCoords = LA.round(LA.subtract(target.mapCoordinates, normDirection))
		const movementCost = Tile.movementCost(fromCoords, target.mapCoordinates)
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