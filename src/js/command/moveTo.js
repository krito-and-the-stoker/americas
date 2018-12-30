import Time from '../timeline/time'
import PathFinder from '../util/pathFinder'
import Move from './move'


const create = async (unit, coords) => {
	if (unit.abortMoveToCommand) {
		unit.abortMoveToCommand()
		unit.abortMoveToCommand = null
	}
	if (unit.resolveWhenMoveOver) {
		await unit.resolveWhenMoveOver
	}
	const path = PathFinder.findPathXY(unit.mapCoordinates, coords).filter((waypoint, index) => index > 0)

	let aborted = false
	let lastMoveOver = false
	const commands = path.map(waypoint => Move.create(unit, waypoint.mapCoordinates, () => {
		if (commands.length > 0 && !aborted ) {
			Time.schedule(commands.shift())
		} else {
			lastMoveOver = true
		}
	}))

	const init = () => {
		const cmd = commands.shift()
		Time.schedule(cmd)
	}
	
	const update = () => !lastMoveOver

	let finalResolve = null
	unit.resolveWhenMoveOver = new Promise(resolve => {
		finalResolve = resolve
	})
	const finished = () => finalResolve()

	unit.abortMoveToCommand = () => aborted = true


	return {
		init,
		update,
		finished,
	}
}


export default { create }