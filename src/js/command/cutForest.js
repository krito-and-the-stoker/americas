import Util from 'util/util'
import Events from 'util/events'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Unit from 'entity/unit'

import Factory from 'command/factory'


export default Factory.create('CutForest', {
	unit: {
		type: 'entity',
		required: true
	},
	eta: {
		type: 'raw'
	},
}, ({ unit, eta }) => {
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (unit.properties.canTerraform && tile.forest && !tile.settlement) {
			eta = currentTime + Time.CUT_FOREST * (unit.expert === 'pioneer' ? 0.6 : 1)
			Unit.update.pioneering(unit, true)
		}

		return {
			eta,
		}
	}

	const update = currentTime => eta && currentTime < eta
	const finished = () => {
		if (eta) {		
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

	return {
		init,
		update,
		finished
	}
})
