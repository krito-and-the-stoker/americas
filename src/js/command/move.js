import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Record from 'util/record'
import Time from 'timeline/time'
import Unit from 'entity/unit'
import EnterColony from 'action/enterColony'
import LeaveColony from 'action/leaveColony'


const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1
const unloading = (unit, fromTile, toTile) => unit.domain === 'land' && fromTile.domain === 'sea' && toTile.domain === 'land'

const createFromData = data => {
	const coords = data.coords
	const unit = data.unit
	const finishedFn = data.finishedFn

	if (coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {
		return {
			update: () => false
		}
	}

	let startTime = data.startTime
	let startCoords = data.startCoords
	let duration = data.duration
	let aborted = data.aborted
	const targetTile = MapEntity.tile(coords)
	let fromTile = null
	let enteringShip = data.enteringShip

	const init = currentTime => {
		startTime = currentTime
		startCoords = startCoords || unit.mapCoordinates

		if(unit.offTheMap) {
			aborted = true
			return false
		}

		if (!inMoveDistance(startCoords, coords)) {
			aborted = true
			return false
		}

		if (startCoords.x === coords.x && startCoords.y === coords.y) {
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
		if (enteringShip) {
			duration = Time.LOAD_TIME
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
		if (finishedFn) {
			finishedFn()
		}
	}

	const save = () => ({
		type: 'move',
		unit: Record.reference(unit),
		coords,
		startTime,
		startCoords,
		duration,
		aborted,
		enteringShip
	})

	return {
		init,
		update,
		finished,
		save,
		priority: true,
	}
	
}

const create = (unit, coords, finishedFn) => createFromData({ unit, coords, finishedFn })

const load = data => {
	data.unit = Record.dereference(data.unit)
	return createFromData(data)
}

export default {
	create,
	load
}