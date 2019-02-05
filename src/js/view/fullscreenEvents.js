import Util from 'util/util'
import Record from 'util/record'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'


const create = name => {
	console.log('fullscreen event', name)
}

const initialize = () => {
	if (!Record.getGlobal('fullscreen-events')) {
		Record.setGlobal('fullscreen-events', {})
	}
	if (!Record.getGlobal('fullscreen-events').discovery) {	
		const unsubscribeTiles = MapEntity.get().tiles
			.filter(tile => tile.domain === 'land')
			.map(tile => 
				Tile.listen.discovered(tile, discovered => {
					if (discovered && !Record.getGlobal('fullscreen-events').discovery) {
						Record.getGlobal('fullscreen-events').discovery = true
						create('discovery')
						Util.execute(unsubscribeTiles)
					}
				})
			)
	}
}

export default { initialize }