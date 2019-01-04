import * as PIXI from 'pixi.js'

import Ressources from '../../render/ressources'
import Colony from '../../entity/colony'


const create = colony => {
	const container = new PIXI.Container()
	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().colonyBackground))
	background.interactive = true
	background.on('pointerdown', e => {
		e.stopPropagation()
	})
	container.addChild(background)

	const coastalDirection = Colony.coastalDirection(colony)
	let coast = null
	if (coastalDirection) {	
		coast = new PIXI.Sprite(new PIXI.Texture(Ressources.get().colonyScreenCoast[coastalDirection]))
		container.addChild(coast)
	}

	const originalDimensions = {
		x: background.width,
		y: background.height
	}

	return {
		container,
		originalDimensions
	}
}

export default {
	create
}