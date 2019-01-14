import Ressources from '../render/ressources'
import Util from '../util/util'

const createTexture = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	return new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame))
}

const create = unit => {
	const sprite = new PIXI.Sprite(createTexture(unit))

	if (unit.domain === 'land') {
		sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)
	}

	return sprite
}


export default {
	createTexture,
	create
}