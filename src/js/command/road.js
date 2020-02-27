import Events from 'util/events'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'

import Factory from 'command/factory'


export default Factory.create('Road', {
	unit: {
		type: 'entity',
		required: true
	},
	eta: {
		type: 'raw'
	}
}, {
	id: 'road',
	display: 'Building road'
}, ({ unit, eta }) => {
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (unit.properties.canTerraform && !tile.road && !tile.settlement) {
			eta = currentTime + Time.CONSTRUCT_ROAD * (unit.expert === 'pioneer' ? 0.6 : 1)
		}

		return {
			eta
		}
	}

	const cancel = () => {
		eta = null
	}

	const update = currentTime => eta && currentTime < eta
	const finished = () => {
		if (eta) {
			Storage.update(unit.equipment, { good: 'tools', amount: -20 })	
			Tile.constructRoad(MapEntity.tile(unit.mapCoordinates))
			Events.trigger('notification', { type: 'terraforming', unit })
			Events.trigger('terraform')
		}
	}

	return {
		init,
		update,
		cancel,
		finished
	}
})
