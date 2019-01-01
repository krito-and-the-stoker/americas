import MapTile from './tile.js'


let numTiles = null
let tiles = null

const	layer = (data, name) => data.layers.find((layer) => layer.name === name)

const	createCoastLine = tiles => {
	//look for coasts and create coast lines
	tiles.forEach(tile => {
		tile.decideCoastTerrain()
	})
	tiles.forEach(tile => {
		tile.decideCoastalSea()
	})
}

const get = () => ({
	numTiles,
	tiles
})

const create = ({ data }) => {
	console.log('creating map')

	const baseLayer = layer(data, 'terrain base')
	numTiles = {
		x: baseLayer.width,
		y: baseLayer.height,
	}
	numTiles.total = numTiles.x * numTiles.y

	console.log('creating tiles')
	tiles = layer(data, 'terrain base').data.map((id, index) => new MapTile({
		id,
		index,
		layers: {
			top: layer(data, 'terrain top').data[index],
			riverSmall: layer(data, 'terrain river small').data[index],
			riverLarge: layer(data, 'terrain river large').data[index],
			bonus: layer(data, 'terrain bonus').data[index]
		}
	}))
	console.log('creating coast line')
	createCoastLine(tiles)
	console.log('map created.')
}

// const neighbor = (center, x, y) => {
// 	if (center + x > numTiles.x || center + x < 0) {
// 		return null
// 	}
// 	let resultIndex = center + x + numTiles.x * y
// 	return resultIndex >= 0 && resultIndex < numTiles.x * numTiles.y ? tiles[resultIndex] : null
// }

	// position(center) {
	// 	return {
	// 		x: (center % this.numTiles.x) * 64,
	// 		y: Math.floor(center / this.numTiles.x) * 64,
	// 	}
	// }

const	tile = ({ x, y }) => tiles[y * numTiles.x + x]
const	mapCoordinates = index => ({
	x: (index % numTiles.x),
	y: Math.floor(index / numTiles.x)
})

export default {
	create,
	get,
	tile,
	mapCoordinates
}