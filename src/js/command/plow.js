import Events from 'util/events'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Storage from 'entity/storage'

import Factory from 'command/factory'


export default Factory.create('Plow', {
	unit: {
		type: 'entity',
		required: true
	},
	eta: {
		type: 'raw'
	}
}, ({ unit, eta }) => {
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (unit.properties.canTerraform && !tile.forest && !tile.settlement && !tile.plowed) {
			eta = currentTime + Time.PLOW * (unit.expert === 'pioneer' ? 0.6 : 1)
			Unit.update.pioneering(unit, true)
		}

		return {
			eta
		}
	}

	const update = currentTime => eta && currentTime < eta
	const finished = () => {
		if (eta) {
			Storage.update(unit.equipment, { good: 'tools', amount: -20 })	
			Tile.plow(MapEntity.tile(unit.mapCoordinates))
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
