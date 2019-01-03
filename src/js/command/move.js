import Time from '../timeline/time'
import MapEntity from '../entity/map'
import Unload from './unload'
import Tile from '../entity/tile'
import Record from '../util/record'

const BASE_TIME = 7500
const UNLOADING_TIME = 2500
const TILE_SIZE = 64

const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1

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

	const init = currentTime => {
		const targetTile = MapEntity.tile(coords)

		if (unit.domain !== targetTile.domain) {
			if (unit.domain === 'sea' && unit.cargo.length > 0 && targetTile.domain === 'land' && inMoveDistance(unit.mapCoordinates, coords)) {
				Time.schedule(Unload.create(unit, coords, finishedFn))
			}
			aborted = true
			return false
		}

		startTime = currentTime
		startCoords = unit.mapCoordinates
		const speed = unit.speed
		const fromTile = MapEntity.tile(unit.mapCoordinates)
		if (fromTile === targetTile) {
			aborted = true
			return false
		}
		if (unit.unloadingInProgress) {
			duration = UNLOADING_TIME
		} else {
			duration = Tile.movementCost(fromTile, targetTile) * BASE_TIME / unit.speed
		}

		if (!inMoveDistance(startCoords, coords)) {
			aborted = true
			return false
		}

		return true
	}

	const update = currentTime => {
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
	}

	const finished = () => {
		if (!aborted) {		
			const tile = MapEntity.tile(coords)
			Tile.discover(tile)
			Tile.diagonalNeighbors(tile).forEach(other => Tile.discover(other))
		}
		if (finishedFn) {
			finishedFn()
		}
	}

	const save = () => ({
		unit: Record.reference(unit),
		coords,
		startTime,
		startCoords,
		duration,
		aborted,
	})

	return {
		type: 'move',
		init,
		update,
		finished,
		coords,
		save
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