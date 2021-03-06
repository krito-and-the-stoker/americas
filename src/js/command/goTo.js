import PathFinder from 'util/pathFinder'
import Record from 'util/record'

import MapEntity from 'entity/map'
import Europe from 'entity/europe'
import Unit from 'entity/unit'

import Commander from 'command/commander'
import Factory from 'command/factory'
import MoveTo from 'command/moveTo'
import America from 'command/america'
import EuropeCommand from 'command/europe'


export default Factory.commander('GoTo', {
	unit: {
		type: 'entity',
		required: true
	},
	colony: {
		type: 'entity',
		default: null
	},
	europe: {
		type: 'raw',
		default: false
	}
}, ({ unit, colony, europe, commander }) => {
	const init = () => {
		if (colony) {
			// from europe to colony
			if (Europe.has.unit(unit)) {
				const tile = MapEntity.tile(colony.mapCoordinates)
				const path = PathFinder.findHighSeas(tile)
				Unit.update.mapCoordinates(unit, path[path.length - 1].mapCoordinates)
				Commander.scheduleBehind(commander, America.create({ unit }))
				Commander.scheduleBehind(commander, MoveTo.create({ unit, coords: colony.mapCoordinates }))
			} else {
				// from somewhere to colony
				Commander.scheduleBehind(commander, MoveTo.create({ unit, coords: colony.mapCoordinates }))
			}
		}

		if (europe) {
			if (!Europe.has.unit(unit)) {
				// from somehwere to europe
				const pathToHighSeas = PathFinder.findHighSeas(unit.tile)
				const target = pathToHighSeas[pathToHighSeas.length - 1]
				Commander.scheduleInstead(commander, MoveTo.create({ unit, coords: target.mapCoordinates }))
				Commander.scheduleBehind(commander, EuropeCommand.create({ unit }))
			}
			// from europe to europe -> nothing to do
		}
	}	

	return {
		init
	}
})
