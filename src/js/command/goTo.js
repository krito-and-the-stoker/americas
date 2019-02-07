import PathFinder from 'util/pathFinder'

import MapEntity from 'entity/map'
import Europe from 'entity/europe'
import Unit from 'entity/unit'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import America from 'command/america'
import EuropeCommand from 'command/europe'


const create = (unit, destination) => {
	const gotoCommander = Commander.create()

	if (destination.type === 'colony') {
		const colony = destination

		// from europe to colony
		if (Europe.has.unit(unit)) {
			const tile = MapEntity.tile(colony.mapCoordinates)
			const path = PathFinder.findHighSeas(tile)
			Unit.update.mapCoordinates(unit, path[path.length - 1].mapCoordinates)
			Commander.scheduleBehind(gotoCommander, America.create(unit))
			Commander.scheduleBehind(gotoCommander, MoveTo.create(unit, colony.mapCoordinates))
		} else {
			// from somewhere to colony
			Commander.scheduleBehind(gotoCommander, MoveTo.create(unit, colony.mapCoordinates))
		}
	}

	if (destination.type === 'europe') {
		if (!Europe.has.unit(unit)) {
			// from somehwere to europe
			const pathToHighSeas = PathFinder.findHighSeas(unit.tile)
			const target = pathToHighSeas[pathToHighSeas.length - 1]
			Commander.scheduleInstead(gotoCommander, MoveTo.create(unit, target.mapCoordinates))
			Commander.scheduleBehind(gotoCommander, EuropeCommand.create(unit))
		}
		// from europe to europe -> nothing to do
	}

	return gotoCommander
}

export default {
	create
}