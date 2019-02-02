import Record from 'util/record'
import Util from 'util/util'
import Message from 'util/message'

import Tile from 'entity/tile.js'
import Owner from 'entity/owner'


let numTiles = null
let tiles = null

const	layer = (data, name) => data.layers.find((layer) => layer.name === name)

const	createCoastLine = tiles => {
	//look for coasts and create coast lines
	tiles.forEach(Tile.decideCoastTerrain)
	tiles.forEach(Tile.decideCoastalSea)
}

const createAreas = tiles => {
	let currentArea = 1
	const markArea = tile => {
		tile.area = currentArea
		let neighbors = Tile.diagonalNeighbors(tile)
			.filter(neighbor => !neighbor.area)
			.filter(neighbor => neighbor.domain === tile.domain)
		while(neighbors.length > 0) {
			neighbors.forEach(n => n.area = currentArea)
			neighbors = neighbors.map(n =>
				Tile.diagonalNeighbors(n)
					.filter(neighbor => !neighbor.area)
					.filter(neighbor => neighbor.domain === tile.domain))
				.flat()
				.filter(Util.unique)
		}
	}
	tiles.forEach(tile => {
		if (!tile.area) {
			markArea(tile)
			currentArea += 1
		}
	})

	Message.log(`Found ${currentArea - 1} seperate areas`)
}

const get = () => ({
	numTiles,
	tiles
})


const create = ({ data }) => {
	Message.log('Creating map')

	const baseLayer = layer(data, 'terrain base')
	numTiles = {
		x: baseLayer.width,
		y: baseLayer.height,
	}
	numTiles.total = numTiles.x * numTiles.y

	Message.log('Creating tiles')
	tiles = layer(data, 'terrain base').data.map((id, index) => Tile.create({
		id,
		index,
		layers: {
			top: layer(data, 'terrain top').data[index],
			riverSmall: layer(data, 'terrain river small').data[index],
			riverLarge: layer(data, 'terrain river large').data[index],
			zone: layer(data, 'zones').data[index]
		}
	}))
	tiles.forEach(Tile.initialize)
	Message.log('Creating coast line')
	createCoastLine(tiles)
	createAreas(tiles)
	Message.log('Map created')

	Record.setGlobal('numTiles', numTiles)
}

const discoverAll = () => {
	tiles.forEach(tile => Tile.discover(tile, Owner.player()))
}

const tileFromIndex = index => tiles[index]
const	tile = ({ x, y }) => x >= 0 && x < numTiles.x && y >= 0 && y < numTiles.y ? tiles[y * numTiles.x + x] : null
const	mapCoordinates = index => ({
	x: (index % numTiles.x),
	y: Math.floor(index / numTiles.x)
})

const save = ({ numTiles }) => ({
	numTiles
})

const prepare = () => {
	numTiles = Record.getGlobal('numTiles')
}

const load = () => {
	Message.log('Loading map...')
	tiles = Util.range(numTiles.x*numTiles.y)
		.map(index => Record.referenceTile({ index }))
		.map(Record.dereferenceTile)

	createCoastLine(tiles)
	createAreas(tiles)

	return { numTiles, tiles }
}

export default {
	create,
	tileFromIndex,
	discoverAll,
	get,
	tile,
	save,
	load,
	prepare,
	mapCoordinates,
}