import Util from 'util/util'
import Record from 'util/record'
import Events from 'util/events'
import Decorators from 'util/decorators'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Unit from 'entity/unit'


const create = Decorators.ensureArguments(1, (unit, eta) => {
	let aborted = false
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (!eta && unit.properties.canTerraform && tile.forest && !tile.settlement) {
			eta = currentTime + Time.CUT_FOREST * (unit.expert === 'pioneer' ? 0.6 : 1)
		}

		if (eta) {
			Unit.update.pioneering(unit, true)
			return true
		}

		aborted = true
		return false
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		if (!aborted) {	
			Storage.update(unit.equipment, { good: 'tools', amount: -20 })	
			const tile = MapEntity.tile(unit.mapCoordinates)
			Tile.clearForest(tile)
			const colony = Util.choose(Tile.radius(tile).filter(tile => tile.colony).map(tile => tile.colony))
			if (colony) {
				const amount = 10 + Math.random() * (unit.expert === 'pioneer' ? 90 : 50)
				Storage.update(colony.storage, { good: 'wood', amount })
			}
			Unit.update.pioneering(unit, false)
			Events.trigger('notification', { type: 'terraforming', unit })
			Events.trigger('terraform')
		}
	}

	const save = () => ({
		module: 'CutForest',
		unit: Record.reference(unit),
		eta
	})

	return {
		init,
		update,
		finished,
		save
	}
})

const load = data => {
	const unit = Record.dereference(data.unit)
	return create(unit, data.eta)
}

export default {
	create,
	load
}