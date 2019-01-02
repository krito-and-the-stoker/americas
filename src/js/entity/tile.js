import Terrain from '../data/terrain.json';
import MovementCosts from '../data/movementCosts'
import RenderView from '../render/view'
import Dialog from '../view/dialog'
import MapEntity from '../entity/map'
import Yield from '../data/yield'

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
		harvestedBy: null,
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
	tile.terrainName = tile.forest ? `${tile.name}WithForest` : (tile.hills ? 'hills' : (tile.mountains ? 'mountains' : tile.name) )

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
	return MovementCosts[to.terrainName]
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
	tile.isCoastalSea = tile.terrain && tile.domain === 'sea' && !tile.coast && diagonalNeighbors(tile).some(other => other.coast)
}


const	applyModifier = (tile, base, name, resource, where) => {
	const terrainName = tile.terrainName
	if (Yield[terrainName][where][resource]) {
		const mod = Yield[terrainName][where][resource][name]
		if (mod) {
			if (mod[0] === '+')
				return base + parseFloat(mod.substr(1))
			if (mod[0] === '*')
				return base * parseFloat(mod.substr(1))

			return mod
		}
	}

	return base
}

const production = (tile, resource, colonist = null) => {
	const where = colonist ? 'field' : 'colony'
	const base = applyModifier(tile, 0, 'base', resource, where)
	const modifiers = ['coast', 'plowed', 'river', 'road', 'resource']
	let result = modifiers
		.reduce((result, name) => (tile[name] ? applyModifier(tile, result, name, resource, where) : result), base)
	if (colonist && colonist.expert === resource) {
		result += applyModifier(tile, result, 'expert', resource, where)
	}

	return result
}

const colonyProductionGoods = tile => Object.keys(Yield[tile.terrainName].colony)

const neighborString = (tile, other) => {
	const result = (c1, c2) => {
		const x1 = c1.x
		const x2 = c2.x
		const y1 = c1.y
		const y2 = c2.y
		if (x1 === x2 && y1 - 1 === y2)
			return 'up'
		if (x1 + 1 === x2 && y1 - 1 === y2)
			return 'rightup'
		if (x1 + 1 === x2 && y1 === y2)
			return 'right'
		if (x1 + 1 === x2 && y1 + 1 === y2)
			return 'rightdown'
		if (x1 === x2 && y1 + 1 === y2)
			return 'down'
		if (x1 - 1 === x2 && y1 + 1 === y2)
			return 'leftdown'
		if (x1 - 1 === x2 && y1 === y2)
			return 'left'
		if (x1 - 1 === x2 && y1 - 1 === y2)
			return 'leftup'
	}

	return result(tile.mapCoordinates, other.mapCoordinates)
}


export default {
	create,
	discover,
	isNextTo,
	production,
	colonyProductionGoods,
	decideCoastTerrain,
	decideCoastalSea,
	diagonalNeighbors,
	movementCost,
	neighborString
}
