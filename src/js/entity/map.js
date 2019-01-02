import Tile from './tile.js'


let numTiles = null
let tiles = null

const	layer = (data, name) => data.layers.find((layer) => layer.name === name)

const	createCoastLine = tiles => {
	//look for coasts and create coast lines
	tiles.forEach(Tile.decideCoastTerrain)
	tiles.forEach(Tile.decideCoastalSea)
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
	tiles = layer(data, 'terrain base').data.map((id, index) => Tile.create({
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


const	tile = ({ x, y }) => x > 0 && x < numTiles.x && y > 0 && y < numTiles.y ? tiles[y * numTiles.x + x] : null
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