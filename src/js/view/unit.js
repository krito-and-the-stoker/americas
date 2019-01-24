import Resources from 'render/resources'
import Util from 'util/util'

const getName = unit => unit.expert ? unit.properties.name[unit.expert] || unit.properties.name.default : unit.properties.name.default
const createTexture = unit => {
	const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
	return Resources.texture('map', { frame })
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
	create,
	getName
}