import * as PIXI from 'pixi.js'

import Units from 'data/units.json'
import Resources from 'render/resources'

const frames = Units.settler.frame

const create = colonist => {
	const frame = colonist.expert ? frames[colonist.expert] || frames.default : frames.default
	const sprite = Resources.sprite('map', { frame })
	sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)

	return sprite
}

export default { create }