import Ressources from '../render/ressources'
import Util from '../util/util'

const createTexture = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	return new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame))
}

const create = unit => {
	return new PIXI.Sprite(createTexture(unit))
}


export default {
	createTexture,
	create
}