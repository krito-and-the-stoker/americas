import Time from '../timeline/time'
import MapEntity from '../entity/map'

const BASE_TIME = 7500
const TILE_SIZE = 64

const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1

const create = (unit, coords, finishedFn) => {
	let startTime = null
	let startCoords = null
	let speed = null
	let duration = null
	let aborted = false
	const update = currentTime => {
		if (unit.domain !== MapEntity.instance.tile(coords.x, coords.y).domain) {
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
			duration = BASE_TIME / unit.speed
			if (!inMoveDistance(startCoords, coords)) {
				aborted = true
				return false
			}
			return true
		}
	}

	const finished = () => {
		if (!aborted) {		
			const tile = MapEntity.instance.tile(coords.x, coords.y)
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