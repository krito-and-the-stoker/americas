import Commander from './commander'
import MapEntity from '../entity/map'
import Unload from './unload'
import Tile from '../entity/tile'
import Record from '../util/record'
import Time from '../timeline/time'
import Colony from '../entity/colony'

const TILE_SIZE = 64

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

	const init = currentTime => {
		if (unit.domain !== targetTile.domain && !targetTile.colony) {
			if (unit.domain === 'sea' && unit.cargo.length > 0 && targetTile.domain === 'land' && inMoveDistance(unit.mapCoordinates, coords)) {
				Commander.scheduleInstead(unit.commander, Unload.create(unit, coords, finishedFn))
			}
			aborted = true
			return false
		}


		startTime = currentTime
		startCoords = unit.mapCoordinates
		const speed = unit.speed
		fromTile = MapEntity.tile(unit.mapCoordinates)

		if (fromTile === targetTile) {
			aborted = true
			return false
		}

		if (unloading(unit, fromTile, targetTile)) {
			duration = Time.UNLOAD_TIME
		} else {
			duration = Tile.movementCost(fromTile, targetTile) * Time.MOVE_BASE_TIME / unit.speed
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
			if (targetTile.colony) {
				Colony.enter(targetTile.colony, unit)
			}
			if (fromTile.colony) {
				Colony.leave(fromTile.colony, unit)
			}
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
		type: 'move',
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