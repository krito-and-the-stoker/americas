import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util'
import Layer from './layer'
import RenderView from './view'

const MAX_TILES = 250000

let numTiles = null
let layer = null
let container = null
let undiscovered = null
let tiles = null
let scale = 1

const get = () => ({
	numTiles,
	layer,
	container,
	undiscovered,
	tiles
})

const updateCoords = ({ x, y }) => {
	container.x = x
	container.y = y
	undiscovered.tilePosition.x = x
	undiscovered.tilePosition.y = y
	render()
}

const updateScale = newScale => {
	container.scale.set(newScale, newScale)
	undiscovered.scale.set(newScale, newScale)
	scale = newScale
	render()
}


const initialize = async mapView => {
	const [undiscoveredTexture, mapTilesTexture] = await loadTexture('images/undiscovered.jpg', 'images/map.png')
	
	layer = new Layer()
	container = new PIXI.particles.ParticleContainer(MAX_TILES)
	undiscovered = new PIXI.extras.TilingSprite(undiscoveredTexture, layer.width, layer.height)

	console.log('creating tiles')
	tiles = mapView.views.map(view => ({
		spites: null,
		view,
		createSprites: () => view.sprites.map(sprite => {
			const tile = new PIXI.Sprite(new PIXI.Texture(mapTilesTexture, rectangle(Math.abs(sprite) - 1)))
			tile.x = view.position.x
			tile.y = view.position.y
			tile.blendMode = sprite > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
			return tile
		})
	}))


	layer.app.stage.addChild(undiscovered)
	layer.app.stage.addChild(container)

	layer.app.stop()

	numTiles = mapView.numTiles

	console.log('first render')
	render()
}

const render = () => {
	container.removeChildren()
	const numTilesX = Math.ceil(layer.width / 64 / scale) + 1
	const numTilesY = Math.ceil(layer.height / 64 / scale) + 1
	const offsetX = -Math.ceil(container.x / 64 / scale)
	const offsetY = -Math.ceil(container.y / 64 / scale)

	const xIndices = range(numTilesX)
		.map(x => x + offsetX)
		.filter(x => x >= 0 && x < numTiles.x)
	const yIndices = range(numTilesY)
		.map(y => y + offsetY)
		.filter(y => y >= 0 && y < numTiles.y)

	xIndices.forEach(x => {
		yIndices.forEach(y => {
			const index = y * numTiles.x + x
			if (!tiles[index].sprites) {
				tiles[index].sprites = tiles[index].createSprites()
			}
			tiles[index].sprites.forEach(sprite => container.addChild(sprite))
		})
	})

	layer.app.render()
}


export default {
	initialize,
	render,
	updateCoords,
	updateScale,
	get
}
