import Record from 'util/record'
import Decorators from 'util/decorators'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'


const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1
const unloading = (unit, fromTile, toTile) => unit.domain === 'land' && fromTile.domain === 'sea' && toTile.domain === 'land'

const createFromData = data => {
	const coords = data.coords
	const unit = data.unit

	if (coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {
		console.warn('coords out of range', coords)
	}

	let startTime = data.startTime
	let startCoords = data.startCoords
	let duration = data.duration
	let aborted = data.aborted
	const targetTile = MapEntity.tile(coords)
	let fromTile = null

	const init = currentTime => {
		startTime = currentTime
		startCoords = startCoords || unit.mapCoordinates

		if(unit.offTheMap) {
			console.warn('unit is off the map. cannot move')
		}

		if (!inMoveDistance(startCoords, coords)) {
			console.warn('unit cannot move to non-adjacent tiles')
		}

		if (startCoords.x === coords.x && startCoords.y === coords.y) {
			console.warn('unit is at target coordinates already')
			aborted = true
			return false
		}

		if (unit.colony) {
			LeaveColony(unit)
		}

		const speed = unit.properties.speed
		fromTile = MapEntity.tile(startCoords)

		duration = Tile.movementCost(fromTile, targetTile) * Time.MOVE_BASE_TIME / speed
		if (unloading(unit, fromTile, targetTile)) {
			duration = Time.UNLOAD_TIME
		}

		return true
	}

	const update = currentTime => {
		const relativeTime = currentTime - startTime
		if (relativeTime > duration) {
			return false
		}
		Unit.update.mapCoordinates(unit, {
			x: startCoords.x + (coords.x - startCoords.x) * relativeTime / duration,
			y: startCoords.y + (coords.y - startCoords.y) * relativeTime / duration
		})

		return true
	}

	const finished = () => {
		if (!aborted) {		
			Unit.update.mapCoordinates(unit, { ...coords })
			Unit.update.tile(unit, targetTile)
			if (targetTile.colony) {
				EnterColony(targetTile.colony, unit)
			}

			Tile.discover(targetTile, unit.owner)
			Tile.diagonalNeighbors(targetTile).forEach(other => Tile.discover(other, unit.owner))
		}
	}

	const save = () => ({
		module: 'Move',
		unit: Record.reference(unit),
		coords,
		startTime,
		startCoords,
		duration,
		aborted,
	})

	return {
		init,
		update,
		finished,
		save,
		priority: true,
	}
	
}

const create = (unit, coords) => createFromData({ unit, coords })

const load = data => {
	const unit = Record.dereference(data.unit)

	return createFromData({
		...data,
		unit
	})
}

export default {
	create,
	load
}