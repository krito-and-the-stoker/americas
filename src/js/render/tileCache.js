import * as PIXI from 'pixi.js'
import Background from './background'

const TILE_SIZE = 64
const MARGIN = 2

const renderTextureSize = {
	x: 2048,
	y: 2048
}

const textures = {}
let numFrames = 0
const renderTextures = []
const tiles = {
	x: Math.floor(renderTextureSize.x / (TILE_SIZE + 2*MARGIN)),
	y: Math.floor(renderTextureSize.y / (TILE_SIZE + 2*MARGIN))
}
const textureSize = tiles.x * tiles.y

const addRenderTexture = () => {
	const baseRenderTexture = new PIXI.BaseRenderTexture(renderTextureSize.x, renderTextureSize.y, PIXI.SCALE_MODES.LINEAR, 1)
	const renderTexture = new PIXI.RenderTexture(baseRenderTexture)
	renderTextures.push(renderTexture)
}

const	currentRenderTexture = () => renderTextures[renderTextures.length-1]
const currentRenderTextureIndex = () => renderTextures.length - 1
const currentFrame = () => numFrames % textureSize
const hasStencil = indices => (typeof getStencil(indices) !== 'undefined')
const stencilReady = indices => (typeof getStencil(indices).texture !== 'undefined')
const getStencil = indices => textures[hash(indices)]
const hash = indices => indices.reduce((s, n) => `${s}${n}x`, '')
const getXYFromFrame = frame => ({
	x : (frame % tiles.x) * (TILE_SIZE + 2*MARGIN) + MARGIN,
	y : Math.floor(frame / tiles.y) * (TILE_SIZE + 2*MARGIN) + MARGIN
})
const getRectFromFrame = frame => {
	const { x, y } = getXYFromFrame(frame)
	return new PIXI.Rectangle(x, y, TILE_SIZE, TILE_SIZE)
}

const addStencil = indices => {
	if(indices.length < 1)
		return false

	if(hasStencil(indices))
		return true

	textures[hash(indices)] = {
		used: 0
	}

	return true
}



const renderStencil = (createSprites, indices) => {
	const renderer = Background.get().layer.app.renderer
	if(currentFrame() === 0)
		addRenderTexture()

	const group = new PIXI.Container()
	const sprites = createSprites(indices)
	const nextFrame = getXYFromFrame(currentFrame())

	sprites.forEach(sprite => {
		sprite.position.set(0, 0)
		sprite.scale.set(1, 1)
		group.addChild(sprite)
	})
	group.position.set(nextFrame.x - MARGIN, nextFrame.y - MARGIN)
	renderer.render(group, currentRenderTexture())
	group.position.set(nextFrame.x - MARGIN, nextFrame.y + MARGIN)
	renderer.render(group, currentRenderTexture())
	group.position.set(nextFrame.x + MARGIN, nextFrame.y - MARGIN)
	renderer.render(group, currentRenderTexture())
	group.position.set(nextFrame.x + MARGIN, nextFrame.y + MARGIN)
	renderer.render(group, currentRenderTexture())
	group.position.set(nextFrame.x, nextFrame.y)
	renderer.render(group, currentRenderTexture())

	getStencil(indices).texture = new PIXI.Texture(currentRenderTexture(), getRectFromFrame(currentFrame()), getRectFromFrame(currentFrame()))
	getStencil(indices).textureIndex = currentRenderTextureIndex()
	numFrames++
}

const createCachedSprite = (createSprites, indices) => {
	if(!hasStencil(indices)){
		if(!addStencil(indices)){
			return null
		}
	}

	if(!stencilReady(indices))
		renderStencil(createSprites, indices)

	const h = hash(indices)
	textures[h].used++
	return new PIXI.Sprite(textures[h].texture)
}

const getTextureIndex = indices => {
	if (!hasStencil(indices)) {
		return null
	}

	return getStencil(indices).textureIndex
}

export default {
	createCachedSprite,
	getTextureIndex
}


