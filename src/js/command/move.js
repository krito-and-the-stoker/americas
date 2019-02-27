import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'

import Factory from 'command/factory'

import EnterColony from 'interaction/enterColony'
import LeaveColony from 'interaction/leaveColony'


const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1
const unloading = (unit, fromTile, toTile) => unit.domain === 'land' && fromTile.domain === 'sea' && toTile.domain === 'land'


export default Factory.create('Move', {
	unit: {
		type: 'entity',
		required: true
	},
	coords: {
		type: 'raw',
		required: true
	},
	startTime: {
		type: 'raw'
	},
	duration: {
		type: 'raw'
	},
	startCoords: {
		type: 'raw'
	}
}, ({ unit, coords, startTime, duration, startCoords }) => {
	if (coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {
		console.warn('coords out of range', coords)
	}

	const targetTile = MapEntity.tile(coords)
	let aborted = false

	const init = currentTime => {
		startCoords = unit.mapCoordinates
		if(unit.offTheMap) {
			console.warn('unit is off the map. cannot move')
		}

		if (!inMoveDistance(startCoords, coords)) {
			console.warn('unit cannot move to non-adjacent tiles', startCoords, coords)
		}

		if (startCoords.x === coords.x && startCoords.y === coords.y) {
			console.warn('unit is at target coordinates already')
			aborted = true
			return false
		}

		if (unit.colony) {
			LeaveColony(unit)
		}

		const speed = unit.properties.speed / (1 + Unit.overWeight(unit))
		const fromTile = MapEntity.tile(startCoords)

		duration = Tile.movementCost(fromTile, targetTile) * Time.MOVE_BASE_TIME / speed
		if (unloading(unit, fromTile, targetTile)) {
			duration = Time.UNLOAD_TIME
		}

		startTime = currentTime

		return {
			startTime,
			duration,
			startCoords
		}
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
		if (!aborted && !unit.disbanded) {		
			Unit.update.mapCoordinates(unit, { ...coords })
			Unit.update.tile(unit, targetTile)
			if (targetTile.colony) {
				EnterColony(targetTile.colony, unit)
			}

			Tile.discover(targetTile, unit.owner)
			Tile.diagonalNeighbors(targetTile).forEach(other => Tile.discover(other, unit.owner))
		}
	}

	return {
		init,
		update,
		finished,
		priority: true,
	}
})
