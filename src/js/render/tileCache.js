import * as PIXI from 'pixi.js'
import Background from './background'

const TILE_SIZE = 64
const MARGIN = 2

const renderTextureSize = {
	x: 128*128,
	y: 128*128
};

const textures = {}
let numFrames = 0
let numStencils = 0
const renderTextures = []
const tiles = {
	x: Math.floor(renderTextureSize.x / (TILE_SIZE + 2*MARGIN)),
	y: Math.floor(renderTextureSize.y / (TILE_SIZE + 2*MARGIN))
};
const textureSize = tiles.x * tiles.y
const rescale = {
	x: (TILE_SIZE + 2*MARGIN) / TILE_SIZE,
	y: (TILE_SIZE + 2*MARGIN) / TILE_SIZE,
};

const addRenderTexture = () => {
	const baseRenderTexture = new PIXI.BaseRenderTexture(renderTextureSize.x, renderTextureSize.y, PIXI.SCALE_MODES.LINEAR, 1)
	const renderTexture = new PIXI.RenderTexture(baseRenderTexture)
	renderTextures.push(renderTexture)
	if (renderTextures.length > 1)
		console.log('multiple rendertextures, now everything breaks down :(')
}

const	currentRenderTexture = () => renderTextures[renderTextures.length-1]
const currentFrame = () => numFrames % textureSize
const hasStencil = indices => (typeof getStencil(indices) !== 'undefined')
const stencilReady = indices => (typeof getStencil(indices).texture !== 'undefined')
const getStencil = indices => textures[hash(indices)]
const hash = indices => indices.reduce((s, n) => `${s}${n}.`, '')
const getXYFromFrame = frame => ({
	x : (frame % tiles.x) * (TILE_SIZE + 2*MARGIN) + MARGIN,
	y : Math.floor(frame / tiles.y) * (TILE_SIZE + 2*MARGIN) + MARGIN
})
const getRectFromFrame = frame => {
	const { x, y } = getXYFromFrame(frame);
	return new PIXI.Rectangle(x, y, TILE_SIZE, TILE_SIZE);
}

const addStencil = indices => {
	if(indices.length < 1)
		return false

	if(hasStencil(indices))
		return true

	textures[hash(indices)] = {
		used: 0
	}
	numStencils++

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
	group.scale.set(rescale.x, rescale.y)
	renderer.render(group, currentRenderTexture())

	getStencil(indices).texture = new PIXI.Texture(currentRenderTexture(), getRectFromFrame(currentFrame()), getRectFromFrame(currentFrame()));
	numFrames++;
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

export default {
	createCachedSprite
}


