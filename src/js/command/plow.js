import Events from 'util/events'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
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
}, {
	id: 'plow',
	display: 'Plowing earth'
}, state => {
	const { unit } = state
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (unit.properties.canTerraform && !tile.forest && !tile.settlement && !tile.plowed) {
			return {
				eta: currentTime + Time.PLOW * (unit.expert === 'pioneer' ? 0.6 : 1)
			}
		}
	}

	const cancel = () => {
		state.eta = null
	}

	const update = currentTime => state.eta && currentTime < state.eta
	const finished = () => {
		if (state.eta) {
			Storage.update(unit.equipment, { good: 'tools', amount: -20 })	
			Tile.plow(MapEntity.tile(unit.mapCoordinates))
			Events.trigger('notification', { type: 'terraforming', unit })
			Events.trigger('terraform')
		}
	}

	return {
		init,
		cancel,
		update,
		finished
	}
})
