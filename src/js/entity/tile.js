import Terrain from '../data/terrain.json';
import MovementCosts from '../data/movementCosts'
import RenderView from '../render/view'
import Dialog from '../view/dialog'
import MapEntity from '../entity/map'

let hasDiscoveredLand = false

const create = ({ id, layers, index }) => {
	const [name, terrain] = Object.entries(Terrain).find(([name, terrain]) => terrain.id === id)
	if (!terrain) {
		console.warn(`No terrain type found for id ${id}.`)
		throw new Error(`No terrain type found for id ${id}.`)
	}

	const tile = {
		index,
		name,
		domain: Terrain[name].domain,
		terrain: terrain,
		forest: layers.top === Terrain.forest.id,
		mountains: layers.top === Terrain.mountains.id,
		riverSmall: layers.riverSmall === Terrain.smallRiver.id,
		riverLarge: layers.riverLarge === Terrain.largeRiver.id,
		bonus: layers.bonus ===  Terrain.bonusResource.id,
		mapCoordinates: MapEntity.mapCoordinates(index),
		plowed: false,
		road: false,
		coast: false,
		coastTerrain: null,
		discovered: false,
	}

	tile.hills = layers.top === Terrain.hills.id || (tile.mountains && Math.random() > 0.1)
	tile.river = tile.riverLarge || tile.riverSmall
	tile.treeVariation = tile.riverLarge || Math.random() > (tile.river ? 0.0 : 0.9)
	tile.mountainVariation = Math.random() > (tile.river ? 0.2 : 0.75) && !tile.bonus || tile.mountains
	tile.hillVariation = Math.random() > (tile.river ? 0.2 : 0.75) && !tile.bonus
	tile.movementCostName = tile.forest ? `${tile.name}WithForest` : (tile.hills ? 'hills' : (tile.mountains ? 'mountains' : tile.name) )

	tile.left = () => left(tile)
	tile.up = () => up(tile)
	tile.right = () => right(tile)
	tile.down = () => down(tile)

	return tile
}


const discover = tile => {
	if (tile.domain === 'land' && !hasDiscoveredLand) {
		hasDiscoveredLand = true
		Dialog.show('discovered')
	}
	tile.discovered = true
	RenderView.render()	
}

const	neighbors = tile => [left(tile), up(tile), right(tile), down(tile)].filter(n => n)
const diagonalNeighbors = tile => {
	let result = neighbors(tile)
	if (up(tile)) {
		result = result.concat([left(up(tile)), right(up(tile))])
	}
	if (down(tile)) {
		result = result.concat([left(down(tile)), right(down(tile))])
	}
	return result.filter(n => n)
}

const left = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x - 1,
	y: tile.mapCoordinates.y
})

const up = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x,
	y: tile.mapCoordinates.y - 1
})

const right = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x + 1,
	y: tile.mapCoordinates.y
})

const down = tile => MapEntity.tile({	
	x: tile.mapCoordinates.x,
	y: tile.mapCoordinates.y + 1
})

const isNextTo = (tile, other) => {
	let pos1 = tile.mapCoordinates
	let pos2 = other.mapCoordinates

	//next to each other but not diagonal
	return Math.abs(pos1.x-pos2.x) + Math.abs(pos1.y-pos2.y) <= 1.1
}

const movementCost = (from, to) => {
	if (neighbors(to).includes(from)) {
		if (to.domain === 'land' && from.domain === 'land' && to.river && from.river) {
			return MovementCosts.river
		}
	}
	return MovementCosts[to.movementCostName]
}

const decideCoastTerrain = tile => {
	if(tile.terrain && tile.terrain.domain === 'sea') {
		const coastalNeighbor = neighbors(tile).find(other => other.terrain && other.terrain.domain === 'land')
		tile.coastTerrain = coastalNeighbor ? coastalNeighbor.terrain : null
		if (!tile.coastTerrain) {
			const coastalDiagonalNeighbor = diagonalNeighbors(tile).find(other => other.terrain && other.terrain.domain === 'land')
			tile.coastTerrain = coastalDiagonalNeighbor ? coastalDiagonalNeighbor.terrain : null
		}
	}

	if(tile.coastTerrain) {
		tile.coast = true
	}
}

const decideCoastalSea = tile => {
	// if (!tile.terrain || tile.terrain !== 'sea' || tile.coast) {
	// 	tile.isCoastalSea = false
	// 	return
	// }

	tile.isCoastalSea = tile.terrain && tile.terrain === 'sea' && !tile.coast && diagonalNeighbors(tile).some(other => other.terrain && other.coast)
}


export default {
	create,
	discover,
	isNextTo,
	decideCoastTerrain,
	decideCoastalSea,
	diagonalNeighbors,
	movementCost,
}
