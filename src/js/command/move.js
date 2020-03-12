import MapEntity from 'entity/map'

import Factory from 'command/factory'


const unloading = (unit, fromTile, toTile) => unit.domain === 'land' && fromTile.domain === 'sea' && toTile.domain === 'land'


export default Factory.create('Move', {
	unit: {
		type: 'entity',
		required: true
	},
	coords: {
		type: 'raw',
		required: true
	}
}, {
	id: 'move',
	display: 'Travelling',
	icon: 'go'
}, ({ unit, coords }) => {
	if (coords.x < 0 || coords.y < 0 || coords.x >= MapEntity.get().numTiles.x || coords.y >= MapEntity.get().numTiles.y) {
		console.warn('coords out of range', coords)
	}

	const targetTile = MapEntity.tile(coords)
	const init = () => {
		unit.movement.target = targetTile
	}

	const update = () => {
		return (unit.tile === unit.movement.target)
	}

	return {
		init,
		update,
		priority: true,
	}
})
