import Time from '../timeline/time'
import MapEntity from '../entity/map'
import Unload from './unload'

const BASE_TIME = 7500
const UNLOADING_TIME = 2500
const TILE_SIZE = 64

const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1

const create = (unit, coords, finishedFn) => {
	if (coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {
		return {
			update: () => false
		}
	}

	let startTime = null
	let startCoords = null
	let speed = null
	let duration = null
	let aborted = false
	const update = currentTime => {
		const targetTile = MapEntity.tile(coords)
		if (unit.domain !== targetTile.domain) {
			if (unit.domain === 'sea' && unit.cargo.length > 0 && targetTile.domain === 'land' && inMoveDistance(unit.mapCoordinates, coords)) {
				Time.schedule(Unload.create(unit, coords, finishedFn))
			}
			aborted = true
			return false
		}
		if (startTime) {
			const relativeTime = currentTime - startTime
			if (relativeTime > duration) {
				unit.sprite.x = TILE_SIZE * coords.x
				unit.sprite.y = TILE_SIZE * coords.y
				unit.mapCoordinates.x = coords.x
				unit.mapCoordinates.y = coords.y
				return false
			}
			unit.sprite.x = TILE_SIZE * (startCoords.x + (coords.x - startCoords.x) * relativeTime / duration)
			unit.sprite.y = TILE_SIZE * (startCoords.y + (coords.y - startCoords.y) * relativeTime / duration)
			return true
		} else {
			startTime = currentTime
			startCoords = unit.mapCoordinates
			speed = unit.speed
			const fromTile = MapEntity.tile(unit.mapCoordinates)
			if (unit.unloadingInProgress) {
				duration = UNLOADING_TIME
			} else {
				duration = targetTile.movementCost(fromTile) * BASE_TIME / unit.speed
			}
			if (!inMoveDistance(startCoords, coords)) {
				aborted = true
				return false
			}
			return true
		}
	}

	const finished = () => {
		if (!aborted) {		
			const tile = MapEntity.tile(coords)
			tile.discover()
			tile.diagonalNeighbors().forEach(n => n.discover())
		}
		if (finishedFn) {
			finishedFn()
		}
	}

	return {
		update,
		finished,
		coords
	}
}

export default {
	create
}