import * as PIXI from 'pixi.js'

import Resources from 'render/resources'
import Colony from 'entity/colony'
import Click from 'input/click'
import Drag from 'input/drag'
import UnjoinColony from 'action/unjoinColony'
import LoadUnitFromShipToColony from 'action/loadUnitFromShipToColony'

const create = colony => {
	const container = new PIXI.Container()
	const background = Resources.sprite('colonyBackground')
	container.addChild(background)

	const coastalDirection = Colony.coastalDirection(colony)
	if (coastalDirection) {
		const coast = Resources.sprite(`coast${coastalDirection}`)
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
		if (args.colonist && args.colonist.colony) {
			UnjoinColony(args.colonist)
		}
		if (args.passenger) {
			LoadUnitFromShipToColony(colony, args.passenger)
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