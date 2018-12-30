import Time from '../timeline/time'

const BASE_TIME = 2000
const TILE_SIZE = 64

const create = (unit, coords, finished) => {
	let startTime = null
	let startCoords = null
	let speed = null
	let duration = null
	const update = currentTime => {
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
			return true
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