import Commander from './commander'
import MapEntity from '../entity/map'
import Unload from './unload'
import Tile from '../entity/tile'
import Record from '../util/record'
import Time from '../timeline/time'
import Colony from '../entity/colony'
import Unit from '../entity/unit'
import Load from '../command/load'
import UnitView from '../view/map/unit'
import EnterColony from '../action/enterColony'
import LeaveColony from '../action/leaveColony'
import InvestigateRumors from '../action/investigateRumors'

const TILE_SIZE = 64

const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1
const unloading = (unit, fromTile, toTile) => unit.domain === 'land' && fromTile.domain === 'sea' && toTile.domain === 'land'
const canLoad = ship => (Commander.isIdle(ship.commander) ||
	ship.commander.currentCommand.type === 'load' ||
	ship.commander.currentCommand.type === 'unload')

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
	const sprite = UnitView.getView(unit).sprite

	const init = currentTime => {
		startTime = currentTime
		startCoords = unit.mapCoordinates

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


		// unload?
		if (unit.domain === 'sea' && unit.passengers.length > 0 && targetTile.domain === 'land' && !targetTile.colony && inMoveDistance(unit.mapCoordinates, coords)) {
			Commander.scheduleInstead(unit.commander, Unload.create(unit, coords, finishedFn))
			aborted = true
			return false
		}


		// load?
		const shipsAtTarget = Unit.at(coords).filter(unit => unit.domain === 'sea')
		if (unit.domain === 'land' &&
				targetTile.domain === 'sea' &&
				shipsAtTarget.some(canLoad)) {
			enteringShip = true
			const ship = shipsAtTarget.find(canLoad)
			Commander.scheduleBehind(ship.commander, Load.create(ship, unit))
		}


		// cannot move here
		if (!enteringShip && unit.domain !== targetTile.domain && !targetTile.colony) {
			aborted = true
			return false
		}


		if (unit.colony) {
			LeaveColony(unit)
		}

		const speed = unit.properties.speed
		fromTile = MapEntity.tile(unit.mapCoordinates)

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
		sprite.x = TILE_SIZE * (startCoords.x + (coords.x - startCoords.x) * relativeTime / duration)
		sprite.y = TILE_SIZE * (startCoords.y + (coords.y - startCoords.y) * relativeTime / duration)
		return true
	}

	const finished = () => {
		if (!aborted) {		
			sprite.x = TILE_SIZE * coords.x
			sprite.y = TILE_SIZE * coords.y
			Unit.update.mapCoordinates(unit, { ...coords })
			if (targetTile.colony) {
				EnterColony(targetTile.colony, unit)
			}

			if (targetTile.rumors) {
				InvestigateRumors(unit)
			}

			Tile.discover(targetTile)
			Tile.diagonalNeighbors(targetTile).forEach(other => Tile.discover(other))
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