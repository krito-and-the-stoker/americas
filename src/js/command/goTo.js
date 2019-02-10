import PathFinder from 'util/pathFinder'
import Record from 'util/record'
import Decorators from 'util/decorators'

import MapEntity from 'entity/map'
import Europe from 'entity/europe'
import Unit from 'entity/unit'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import America from 'command/america'
import EuropeCommand from 'command/europe'


const create = Decorators.ensureArguments(2, (unit, destination, commander = null) => {
	const gotoCommander = commander ? commander : Commander.create()

	const init = () => {
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

		return gotoCommander.init()
	}

	const update = () => {
		if (command.pleaseStop) {
			gotoCommander.pleaseStop = true
		}
		return gotoCommander.update()
	}
	const stopped = () => gotoCommander.stopped()

	const save = () => ({
		gotoCommander: gotoCommander.save(),
		unit: Record.reference(unit),
		destination: destination.type === 'colony' ? Record.reference(destination) : destination,
		module: 'GoTo'
	})

	const command = {
		init,
		update,
		save,
		stopped,
		priority: true
	}

	return command
})

const load = data => {
	const commander = Commander.load(data.gotoCommander)
	const unit = Record.dereference(data.unit)
	const destination = data.destination.type === 'colony' ? Record.dereference(data.destination) : data.destination

	return create(unit, destination, commander)
}

export default {
	create,
	load
}