import Time from 'timeline/time'
import PathFinder from 'util/pathFinder'
import MapEntity from 'entity/map'
import Move from './move'
import Commander from './commander'
import Europe from './europe'
import Record from 'util/record'
import Dialog from 'view/ui/dialog'
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


const create = (unit, coords, moveToCommander = null, hasPath = false) => {
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
	if (target.name === 'sea lane' && !hasPath) {	
		Dialog.create({
			type: 'naval',
			text: 'Would you like to set sail for Europe?',
			options: [{
				text: 'Yes, steady as she goes!',
				action: () => Commander.scheduleBehind(moveToCommander, Europe.create(unit))
			}, {
				text: 'No let as remain here',
				action: () => {},
				default: true
			}],
			coords: unit.mapCoordinates
		})
	}

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
				moveToCommander.commands = path.map(waypoint => Move.create(unit, waypoint.mapCoordinates)).concat(moveToCommander.commands)
				hasPath = true
			}
		}

		return true
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
			!target.colony) {
			const targetCoords = Tile.diagonalNeighbors(MapEntity.tile(unit.mapCoordinates))
				.filter(n => n.domain === 'land')
				.map(n => n.mapCoordinates)
				.reduce((min, c) => Util.distance(unit.mapCoordinates, c) < Util.distance(unit.mapCoordinates, min) ? c : min, coords)
			if (inMoveDistance(unit.tile.mapCoordinates, targetCoords)) {
				Commander.scheduleInstead(unit.commander, Unload.create(unit, targetCoords))
			}
		}
	}

	const save = () => ({
		type: 'moveTo',
		coords,
		hasPath,
		moveToCommander: moveToCommander.save(),
		unit: Record.reference(unit)
	})

	const moveTo = {
		init,
		update,
		finished,
		priority: true,
		currentCommand: moveToCommander.currentCommand,
		commands: moveToCommander.commands,
		save
	}

	return moveTo
}

const load = data => {
	const unit = Record.dereference(data.unit)
	const commander = Commander.load(data.moveToCommander)
	const coords = data.coords
	return create(unit, data.coords, commander, data.hasPath)
}


export default {
	create,
	load
}