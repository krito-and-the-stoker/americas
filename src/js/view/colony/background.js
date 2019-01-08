import * as PIXI from 'pixi.js'

import Ressources from '../../render/ressources'
import Colony from '../../entity/colony'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Util from '../../util/util'


const create = colony => {
	const container = new PIXI.Container()
	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().colonyBackground))
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

	// capture click on background so we dont close the screen
	Click.on(background, () => {})

	const leaveColonyZone = new PIXI.Container()
	leaveColonyZone.hitArea = new PIXI.Rectangle(
		0.3 * originalDimensions.x,
		0.65 * originalDimensions.y,
		(1 - 0.3) * originalDimensions.x,
		0.25 * originalDimensions.y)		
	container.addChild(leaveColonyZone)

	Drag.makeDragTarget(leaveColonyZone, args => {
		console.log(args)
		if (args.colonist && args.colonist.colony.colonists.length > 1) {
			Colony.unjoin(args.colonist.colony, args.colonist)
			Colony.enter(args.colonist.colony, args.colonist.unit)
		}
	})

	return {
		container,
		originalDimensions
	}
}

export default {
	create
}