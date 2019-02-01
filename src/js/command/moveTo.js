import PathFinder from 'util/pathFinder'
import MapEntity from 'entity/map'
import Move from './move'
import Commander from './commander'
import Record from 'util/record'
import Unit from 'entity/unit'
import Load from 'command/load'
import Unload from './unload'
import Tile from 'entity/tile'
import Util from 'util/util'


const canLoad = ship => (Commander.isIdle(ship.commander) ||
	ship.commander.currentCommand.type === 'load' ||
	ship.commander.currentCommand.type === 'unload')

const canLoadTreasure = ship => (Commander.isIdle(ship.commander) ||
	ship.commander.currentCommand.type === 'load' ||
	ship.commander.currentCommand.type === 'unload') && ship.properties.canTransportTreasure

const inMoveDistance = (coords1, coords2) => Math.abs(coords1.x - coords2.x) <= 1 && Math.abs(coords1.y - coords2.y) <= 1


const create = (unit, coords, moveToCommander = null, hasPath = false, lastPoint = null) => {
	if (unit.unloadingInProgress ||
		coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {

		return {
			update: () => false
		}
	}

	if (!moveToCommander) {
		moveToCommander = Commander.create()
	}

	const target = MapEntity.tile(coords)
	const update = () => {
		if (moveTo.pleaseStop) {
			moveToCommander.pleaseStop = true
		}

		return moveToCommander.update()
	}

	const init = () => {
		if (moveToCommander.init) {
			moveToCommander.init()
		}

		if (!hasPath) {
			if (unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y) {
				return false
			}

			if (!MapEntity.tile(unit.mapCoordinates)) {
				console.warn('unit is adrift', unit.mapCoordinates, unit)
				return false
			}

			if (!hasPath) {
				const path = PathFinder.findPathXY(unit.mapCoordinates, coords, unit).filter((waypoint, index) => index > 0)
				moveToCommander.commands = path.map(waypoint => Move.create(unit, waypoint.mapCoordinates))
				lastPoint = path.length > 0 ? path[path.length - 1].mapCoordinates : unit.mapCoordinates
				hasPath = true
			}
		}

		return true
	}

	const stopped = () => {
		moveToCommander.stopped()
	}

	const finished = () => {
		if (moveToCommander.finished) {
			moveToCommander.finished()
		}

		const shipsAtTarget = Unit.at(coords).filter(unit => unit.domain === 'sea')
		if (unit.domain === 'land' &&
				target.domain === 'sea' &&
				shipsAtTarget.some(unit.treasure ? canLoadTreasure : canLoad) &&
				inMoveDistance(unit.tile.mapCoordinates, coords)) {
			const ship = shipsAtTarget.find(unit.treasure ? canLoadTreasure : canLoad)
			Commander.scheduleBehind(ship.commander, Load.create(ship, unit))
			Commander.scheduleInstead(unit.commander, Move.create(unit, coords))
		}

		if (unit.domain === 'sea' &&
			unit.passengers.length > 0 &&
			target.domain === 'land' &&
			!target.colony
			&& Util.distance(unit.mapCoordinates, lastPoint) < 1) {
			const targetCoords = Tile.diagonalNeighbors(MapEntity.tile(unit.mapCoordinates))
				.filter(n => n.domain === 'land')
				.map(n => n.mapCoordinates)
				.reduce((min, c) => Util.distance(coords, c) < Util.distance(coords, min) ? c : min, unit.mapCoordinates)
			Commander.scheduleInstead(unit.commander, Unload.create(unit, targetCoords))
		}
	}

	const save = () => ({
		type: 'moveTo',
		coords,
		hasPath,
		moveToCommander: moveToCommander.save(),
		unit: Record.reference(unit),
		lastPoint
	})

	const moveTo = {
		init,
		update,
		finished,
		priority: true,
		currentCommand: moveToCommander.currentCommand,
		commands: moveToCommander.commands,
		save,
		stopped
	}

	return moveTo
}

const load = data => {
	const unit = Record.dereference(data.unit)
	const commander = Commander.load(data.moveToCommander)
	const coords = data.coords
	return create(unit, data.coords, commander, data.hasPath, data.lastPoint)
}


export default {
	create,
	load
}