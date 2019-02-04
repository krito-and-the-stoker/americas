import * as PIXI from 'pixi.js'
import Util from 'util/util'
import Layer from './layer'
import RenderView from './view'
import TileCache from './tileCache'
import Resources from './resources'
import MapView from 'render/map'
import MapEntity from 'entity/map'
import Message from 'util/message'
import Tile from 'entity/tile'

const MAX_TILES = 30000

let numTiles = null
let layer = null
let containers = []
let undiscovered = null
let tiles = null
let scale = 1
let renderRequested = false
let visible = true

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
		} else {
			updateScale(RenderView.get().scale)
			updateCoords(RenderView.get().coords)
		}
		layer.app.stage.addChild(container)
		containers.push(container)
	}

	return containers[index]
}

const hide = () => {
	if (visible) {
		visible = false
		render()
	}
}

const show = () => {
	if (!visible) {
		visible = true
		render()
	}
}

const createSpriteFromFrames = frames => frames.map(frame => {
	const sprite = Resources.sprite('map', { frame: Math.abs(frame) - 1 })
	sprite.blendMode = frame > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
	return sprite
})

const createSpritesFromTile = tile => createSpriteFromFrames(MapView.instance.assembleTile(tile))

const createTiles = tileStacks => tileStacks.map(stack => ({
	spites: null,
	stack,
	container: null,
	initialized: false,
	createSprites: () => stack.frames.map(frame => {
		const sprite = Resources.sprite('map', { frame: Math.abs(frame) - 1 })
		sprite.x = stack.position.x
		sprite.y = stack.position.y
		sprite.blendMode = frame > 0 ? PIXI.BLEND_MODES.NORMAL : PIXI.BLEND_MODES.OVERLAY
		return sprite
	}),
	createCachedSprites: () => {
		const sprite = TileCache.createCachedSprite(createSpriteFromFrames, stack.frames)
		if (sprite) {			
			sprite.position.x = stack.position.x
			sprite.position.y = stack.position.y
			return [sprite]
		}
		return []
	},
	update: (tile, coords) => {
		if (tile.initialized) {
			if (tile.dirty) {
				const newStack = MapView.instance.assembleTileXY(coords)
				if (newStack.length !== tile.stack.frames.length || !newStack.every((frame, i) => frame === tile.stack.frames[i])) {
					tile.stack.frames = newStack
					tile.initialized = false
				} else {
					tile.dirty = false
				}
			}
		} else {
			tile.stack.frames = MapView.instance.assembleTileXY(coords)
			tile.initialized = false					
		}
	},
	initialize: tile => {
		tile.sprites = tile.createCachedSprites()
		const index = TileCache.getTextureIndex(tile.stack.frames)
		tile.container = getContainer(index)
		tile.initialized = true
		tile.dirty = false
	}
}))

let unsubscribeTiles = () => {}
const restart = () => {
	Message.log('Reassembling tiles')
	tiles = createTiles(MapView.instance.tileStacks)
	numTiles = MapView.instance.numTiles

	Util.execute(unsubscribeTiles)
	unsubscribeTiles = tiles.map((tile, index) => 
		Tile.listen.tile(MapEntity.get().tiles[index], () => {
			tile.dirty = true
			render()
		}))

	render()
}

const initialize = () => {
	const mapView = MapView.instance

	layer = new Layer({
		transparent: true,
		clearBeforeRender: false,
		preserveDrawingBuffer: true,
	})

	undiscovered = new PIXI.extras.TilingSprite(Resources.texture('undiscovered'), layer.width, layer.height)

	layer.app.stage.addChild(undiscovered)
	layer.app.stop()

	if (mapView) {	
		Message.log('Assembling tiles')
		tiles = createTiles(mapView.tileStacks)
		numTiles = mapView.numTiles

		Util.execute(unsubscribeTiles)
		unsubscribeTiles = tiles.map((tile, index) => 
			Tile.listen.tile(MapEntity.get().tiles[index], () => {
				tile.dirty = true
				render()
			}))

		render()
	}

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
	if (!renderRequested) {
		return
	}
	containers.forEach(container => {
		container.removeChildren()
	})

	if (visible) {
		const numTilesX = Math.ceil(layer.width / 64 / scale) + 1
		const numTilesY = Math.ceil(layer.height / 64 / scale) + 1
		const offsetX = -Math.ceil(undiscovered.tilePosition.x / 64 / scale)
		const offsetY = -Math.ceil(undiscovered.tilePosition.y / 64 / scale)

		const xIndices = Util.range(numTilesX)
			.map(x => x + offsetX)
			.filter(x => x >= 0 && x < numTiles.x)
		const yIndices = Util.range(numTilesY)
			.map(y => y + offsetY)
			.filter(y => y >= 0 && y < numTiles.y)

		xIndices.forEach(x => {
			yIndices.forEach(y => {
				const index = y * numTiles.x + x
				tiles[index].update(tiles[index], { x, y })
				if (!tiles[index].initialized) {
					tiles[index].initialize(tiles[index])
				}
				tiles[index].sprites.forEach(sprite => {
					tiles[index].container.addChild(sprite)
				})
			})
		})
		layer.app.render()
		renderRequested = false
	}
}


export default {
	initialize,
	restart,
	render,
	hide,
	show,
	doRenderWork,
	updateCoords,
	updateScale,
	createSpritesFromTile,
	get
}
