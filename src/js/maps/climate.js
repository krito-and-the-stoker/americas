const AmericaLarge = require('./america-large.json')
const Terrain = require('../data/terrain.json')
const Climate = require('./climate.json')


const range = n => [...Array(n).keys()]

// const radius = tile => diagonalNeighbors(tile).concat([tile])
const	neighbors = tile => [left(tile), up(tile), right(tile), down(tile)].filter(n => n)
const diagonalNeighbors = tile => {
	let result = neighbors(tile)
	if (up(tile)) {
		result = result.concat([left(up(tile)), right(up(tile))])
	}
	if (down(tile)) {
		result = result.concat([left(down(tile)), right(down(tile))])
	}
	if (!up(tile) && !down(tile)) {
		console.warn('tile has no vertical neighbors', tile)
	}
	return result.filter(n => n)
}
const	tileFromCoords = ({ x, y }) => x >= 0 && x < numTiles.x && y >= 0 && y < numTiles.y ? tiles[y * numTiles.x + x] : null
const left = tile => tileFromCoords({	
	x: tile.mapCoordinates.x - 1,
	y: tile.mapCoordinates.y
})

const up = tile => tileFromCoords({	
	x: tile.mapCoordinates.x,
	y: tile.mapCoordinates.y - 1
})

const right = tile => tileFromCoords({	
	x: tile.mapCoordinates.x + 1,
	y: tile.mapCoordinates.y
})

const down = tile => tileFromCoords({	
	x: tile.mapCoordinates.x,
	y: tile.mapCoordinates.y + 1
})


let numTiles = {}
let tiles = []
const	mapCoordinates = index => ({
	x: (index % numTiles.x),
	y: Math.floor(index / numTiles.x)
})

const terrainName = tile =>
	(tile.forest && tile.domain === 'land') ? `${tile.name}WithForest` :
		(tile.mountains ? 'mountains' :
			(tile.hills ? 'hills' : tile.name))

const baseName = tile =>
	(tile.forest && tile.domain === 'land') ? `${tile.name}WithForest` : tile.name

const createTile = ({ id, layers, index }) => {
	const [name, terrain] = Object.entries(Terrain).find(([, terrain]) => terrain.id === id)
	if (!terrain) {
		console.warn(`No terrain type found for id ${id}.`)
		throw new Error(`No terrain type found for id ${id}.`)
	}

	const tile = {
		index,
		id,
		name,
		domain: Terrain[name].domain,
		terrain: terrain,
		forest: layers.top === Terrain.forest.id,
		mountains: layers.top === Terrain.mountains.id,
		riverSmall: layers.riverSmall === Terrain.smallRiver.id,
		riverLarge: layers.riverLarge === Terrain.largeRiver.id,
		mapCoordinates: mapCoordinates(index),
		zone: layers.zone,
		harvestedBy: null,
		plowed: false,
		road: false,
		coast: false,
		coastTerrain: null,
		discoveredBy: [],
		units: [],
	}

	if (tile.domain === 'sea') {
		tile.forest = false
	}
	tile.river = tile.riverLarge || tile.riverSmall
	tile.hills = layers.top === Terrain.hills.id

	tile.baseName = baseName(tile)
	tile.terrainName = terrainName(tile)

	return tile
}


const	layer = (data, name) => data.layers.find((layer) => layer.name === name)
const createTiles = data => {
	const baseLayer = layer(data, 'terrain base')
	numTiles = {
		x: baseLayer.width,
		y: baseLayer.height,
	}
	numTiles.total = numTiles.x * numTiles.y

	return layer(data, 'terrain base').data.map((id, index) => createTile({
		id,
		index,
		layers: {
			top: layer(data, 'terrain top').data[index],
			riverSmall: layer(data, 'terrain river small').data[index],
			riverLarge: layer(data, 'terrain river large').data[index],
			zone: layer(data, 'zones').data[index]
		}
	}))
}

const poleLocation = () => (numTiles.y / 2 - 20)
const poleFraction = y => (poleLocation() - y) / (numTiles.y / 2)
const smooth = tiles => {
	tiles.forEach(tile => {
		let weightSum = 0
		tile.newTemperature = 0
		tile.newSeasonStrength = 0
		diagonalNeighbors(tile)
			.forEach(neighbor => {
				weightSum += 1
				tile.newTemperature += neighbor.temperature
				tile.newSeasonStrength += neighbor.seasonStrength
			})
		const strength = 50*Climate.weight[tile.terrainName]
		tile.newTemperature = (tile.newTemperature + strength * tile.temperature) / (strength + weightSum)
		tile.newSeasonStrength = (tile.newSeasonStrength + strength * tile.seasonStrength) / (strength + weightSum)
	})
	tiles.forEach(tile => {
		tile.temperature = tile.newTemperature
		tile.seasonStrength = tile.newSeasonStrength
	})
}

const analyseMap = data => {
	tiles = createTiles(data)

	tiles.forEach(tile => {
		const pole = poleFraction(tile.mapCoordinates.y)
		tile.sunIndicator = 25 * Math.sign(pole) * (Math.abs(pole) + 0.2) * (Math.abs(pole) + 0.2) * (Math.abs(pole) + 0.2)
		tile.seasonStrength = Climate.season[tile.terrainName]

		if (tile.domain === 'sea') {
			tile.temperature = (Math.abs(pole) + 0.2) * (Math.abs(pole) + 0.2) * Climate.temperature.oceanPole + (1 - (Math.abs(pole) + 0.2) * (Math.abs(pole) + 0.2)) * Climate.temperature.oceanEquator
		} else {
			const baseTemperature = Climate.temperature[tile.baseName]
			tile.temperature = baseTemperature +
				pole * Climate.modifier.pole + (1 - pole) * Climate.modifier.equator +
				(tile.mountains ? Climate.modifier.mountains : 0) +
				(tile.hills ? Climate.modifier.hills : 0) +
				(tile.riverSmall ? Climate.modifier.riverSmall : 0) +
				(tile.riverLarge ? Climate.modifier.riverLarge : 0)
		}
	})
	range(100).forEach(() => smooth(tiles))

	return tiles.map(tile => ({
		temperature: tile.temperature,
		seasonStrength: tile.sunIndicator * tile.seasonStrength
	}))
}

const analyse = () => {
	return {
		americaLarge: analyseMap(AmericaLarge)
	}
}

module.exports = { analyse }
