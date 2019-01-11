import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'
import MapEntity from '../entity/map'
import Move from './move'
import Commander from './commander'
import Europe from './europe'
import Record from '../util/record'
import Dialog from '../view/ui/dialog'


const create = (unit, coords) => {
	if (unit.unloadingInProgress ||
		coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y || (unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)) {
		return {
			update: () => false
		}
	}

	const moveToCommander = Commander.create()

	const target = MapEntity.tile(coords)
	if (target.name === 'sea lane') {	
		Dialog.show('europe').then(decision => {
			if (decision === 0) {
				Commander.scheduleBehind(moveToCommander, Europe.create(unit))
			}
		})
	}

	const originalInit = moveToCommander.init
	moveToCommander.init = () => {
		if (originalInit) {
			originalInit()
		}

		const path = PathFinder.findPathXY(unit.mapCoordinates, coords, unit).filter((waypoint, index) => index > 0)
		moveToCommander.commands = path.map(waypoint => Move.create(unit, waypoint.mapCoordinates))
		return true
	}

	moveToCommander.save = () => ({
		type: 'moveTo',
		commands: moveToCommander.commands.map(cmd => cmd.save()),
		currentCommand: moveToCommander.currentCommand ? moveToCommander.currentCommand.save() : null,
		coords,
		unit: Record.reference(unit)
	})

	return moveToCommander
}

const load = data => {
	if (data.commands) {
		const commands = (data.currentCommand ? [data.currentCommand, ...data.commands] : data.commands).map(cmd => Commander.getModule(cmd.type).load(cmd))
		return Commander.create({ commands })
	} else {
		const unit = Record.dereference(data.unit)
		return create(unit, data.coords)
	}
}


export default {
	create,
	load
}