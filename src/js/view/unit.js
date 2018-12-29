import * as PIXI from 'pixi.js'
import Util from '../util/util'
import Foreground from '../render/foreground'


let map = null

const initialize = async () => {
	[map] = await Util.loadTexture('images/map.png')
}

const createSprite = (id, x, y) => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(map, Util.rectangle(id)))
	sprite.x = x
	sprite.y = y
	Foreground.add(sprite)
	return sprite
}


export default {
	createSprite,
	initialize
}
