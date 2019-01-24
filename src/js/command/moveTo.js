import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'
import MapEntity from '../entity/map'
import Move from './move'
import Commander from './commander'
import Europe from './europe'
import Record from '../util/record'
import Dialog from '../view/ui/dialog'


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
		Dialog.show('europe').then(decision => {
			if (decision === 0) {
				Commander.scheduleBehind(moveToCommander, Europe.create(unit))
			}
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