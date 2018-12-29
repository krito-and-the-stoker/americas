import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util'
import Layer from './layer'
import RenderView from './view'
import TileCache from './tileCache'

const MAX_TILES = 30000

let numTiles = null
let layer = null
let containers = []
let undiscovered = null
let tiles = null
let scale = 1
let renderRequested = false

const get = () => ({
	numTiles,
	layer,
	containers,
	undiscovered,
	tiles,
	renderRequested
})

const updateCoords = ({ x, y }) => {
	containers.forEach(container => {	
		container.x = x
		container.y = y
	})
	undiscovered.tilePosition.x = x
	undiscovered.tilePosition.y = y
	render()
}

const updateScale = newScale => {
	containers.forEach(container => {	
		container.scale.set(newScale, newScale)
	})
	undiscovered.tileScale.set(newScale, newScale)
	scale = newScale
	render()
}

const getContainer = index => {
	while (containers.length <= index) {
		const container = new PIXI.particles.ParticleContainer(MAX_TILES)
		if (containers.length > 0) {		
			container.x = containers[containers.length - 1].x
			container.y = containers[containers.length - 1].y
			container.scale.set(scale, scale)
		}
		layer.app.stage.addChild(container)
		containers.push(container)
	}

	return containers[index]
}


const initialize = async mapView => {
	const [undiscoveredTexture, mapTilesTexture] = await loadTexture('images/undiscovered.jpg', 'images/map.png')
	
	layer = new Layer({
		transparent: true,
		clearBeforeRender: false,
		preserveDrawingBuffer: true,
	})

	undiscovered = new PIXI.extras.TilingSprite(undiscoveredTexture, layer.width, layer.height)

	console.log('creating tiles')
	tiles = mapView.tileStacks.map(stack => ({
		spites: null,
		stack,
		container: null,
		initialized: false,
		createSprites: () => stack.frames.map(frame => {
			const sprite = new PIXI.Sprite(new PIXI.Texture(mapTilesTexture, rectangle(Math.abs(frame) - 1)))
			sprite.x = stack.position.x
			sprite.y = stack.position.y
			sprite.blendMode = frame > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
			return sprite
		}),
		createCachedSprites: () => {		
			const spriteFromFrames = frames => frames.map(frame => {
				const sprite = new PIXI.Sprite(new PIXI.Texture(mapTilesTexture, rectangle(Math.abs(frame) - 1)))
				sprite.blendMode = frame > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
				return sprite
			})
			const sprite = TileCache.createCachedSprite(spriteFromFrames, stack.frames)
			if (sprite) {			
				sprite.position.x = stack.position.x
				sprite.position.y = stack.position.y
				return [sprite]
			}
			return []
		},
		initialize: tile => {
			tile.sprites = tile.createCachedSprites()
			const index = TileCache.getTextureIndex(tile.stack.frames)
			tile.container = getContainer(index)
			tile.initialized = true
		}
	}))


	layer.app.stage.addChild(undiscovered)
	layer.app.stop()

	numTiles = mapView.numTiles

	console.log('first render')
	render()

	window.addEventListener('resize', resize)
}

const resize = () => {
	undiscovered.width = layer.width
	undiscovered.height = layer.height
	render()
}

const render = () => {
	renderRequested = true
}

const doRenderWork = () => {
	containers.forEach(container => {
		container.removeChildren()
	})
	const numTilesX = Math.ceil(layer.width / 64 / scale) + 1
	const numTilesY = Math.ceil(layer.height / 64 / scale) + 1
	const offsetX = -Math.ceil(undiscovered.tilePosition.x / 64 / scale)
	const offsetY = -Math.ceil(undiscovered.tilePosition.y / 64 / scale)

	const xIndices = range(numTilesX)
		.map(x => x + offsetX)
		.filter(x => x >= 0 && x < numTiles.x)
	const yIndices = range(numTilesY)
		.map(y => y + offsetY)
		.filter(y => y >= 0 && y < numTiles.y)

	xIndices.forEach(x => {
		yIndices.forEach(y => {
			const index = y * numTiles.x + x
			if (!tiles[index].initialized) {
				tiles[index].initialize(tiles[index])
			}
			tiles[index].sprites.forEach(sprite => tiles[index].container.addChild(sprite))
		})
	})
	layer.app.render()
}


export default {
	initialize,
	render,
	doRenderWork,
	updateCoords,
	updateScale,
	get
}
