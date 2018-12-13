import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util'
import Layer from './layer'
import RenderView from './view'
import TileCache from './tileCache'

const MAX_TILES = 30000

let numTiles = null
let layer = null
let container = null
let undiscovered = null
let tiles = null
let scale = 1
let renderRequested = false

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
	undiscovered.tileScale.set(newScale, newScale)
	scale = newScale
	render()
}


const initialize = async mapView => {
	const [undiscoveredTexture, mapTilesTexture] = await loadTexture('images/undiscovered.jpg', 'images/map.png')
	
	layer = new Layer({
		transparent: true,
		clearBeforeRender: false
	})
	container = new PIXI.particles.ParticleContainer(MAX_TILES)
	undiscovered = new PIXI.extras.TilingSprite(undiscoveredTexture, layer.width, layer.height)

	console.log('creating tiles')
	tiles = mapView.tileStacks.map(stack => ({
		spites: null,
		stack,
		createSprites: () => stack.frames.map(frame => {
			const sprite = new PIXI.Sprite(new PIXI.Texture(mapTilesTexture, rectangle(Math.abs(frame) - 1)))
			sprite.x = stack.position.x
			sprite.y = stack.position.y
			sprite.blendMode = frame > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
			return sprite
		}),
		createCachedSprites: () => {		
			const spriteFromFrames = frames => frames.map(frame => new PIXI.Sprite(new PIXI.Texture(mapTilesTexture, rectangle(Math.abs(frame) - 1))))
			const sprite = TileCache.createCachedSprite(spriteFromFrames, stack.frames)
			if (sprite) {			
				sprite.position.x = stack.position.x
				sprite.position.y = stack.position.y
				return [sprite]
			}
			return []
		}
	}))


	layer.app.stage.addChild(undiscovered)
	layer.app.stage.addChild(container)

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
	if (!renderRequested) {
		renderRequested = true
		requestAnimationFrame(() => {	
			renderRequested = false
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
						tiles[index].sprites = tiles[index].createCachedSprites()
					}
					tiles[index].sprites.forEach(sprite => container.addChild(sprite))
				})
			})
			layer.app.render()
		})
	}
}


export default {
	initialize,
	render,
	updateCoords,
	updateScale,
	get
}
