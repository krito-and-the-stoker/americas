import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'
import MapEntity from '../entity/map'
import Move from './move'
import Commander from './commander'


const create = (unit, coords) => {
	if (unit.unloadingInProgress ||
		coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y || (unit.mapCoordinates.x === coords.x && unit.mapCoordinates.y === coords.y)) {
		return {
			update: () => false
		}
	}

	const moveToCommander = Commander.create()
	const originalInit = moveToCommander.init
	moveToCommander.init = () => {
		if (originalInit) {
			originalInit()
		}

		const path = PathFinder.findPathXY(unit.mapCoordinates, coords).filter((waypoint, index) => index > 0)
		moveToCommander.commands = path.map(waypoint => Move.create(unit, waypoint.mapCoordinates))
		return true
	}

	return moveToCommander
}

const load = data => ({
	update: () => false
})


export default {
	create,
	load
}