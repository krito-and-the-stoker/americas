import Events from 'util/events'
import PathFinder from 'util/pathFinder'

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
}, state => {
	const { unit } = state
	const init = currentTime => {
		const tile = unit.tile
		if (tile && unit.properties.canTerraform && !tile.road && !tile.settlement) {
			const closeColony = PathFinder.findNearColony(unit)
			const colonyText = closeColony ? ` near ${closeColony.name}` : ''
			Factory.update.display(state, `Building road${colonyText}`)
			return {
				eta: currentTime + Time.CONSTRUCT_ROAD * (unit.expert === 'pioneer' ? 0.6 : 1)
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
			Tile.constructRoad(unit.tile)
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
