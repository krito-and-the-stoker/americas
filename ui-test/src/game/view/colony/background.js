import * as PIXI from 'pixi.js'

import Resources from 'render/resources'
import Colony from 'entity/colony'
import Click from 'input/click'
import Drag from 'input/drag'
import UnjoinColony from 'interaction/unjoinColony'
import LoadUnitFromShipToColony from 'interaction/loadUnitFromShipToColony'

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
	const unsubscribeClick = Click.on(background)

	const leaveColonyZone = new PIXI.Container()
	leaveColonyZone.hitArea = new PIXI.Rectangle(
		0.3 * originalDimensions.x,
		0.65 * originalDimensions.y,
		(1 - 0.3) * originalDimensions.x,
		0.25 * originalDimensions.y)		
	container.addChild(leaveColonyZone)

	const unsubscribeDragTarget = Drag.makeDragTarget(leaveColonyZone, ({ colonist, passenger }) => {
		if (colonist && colonist.colony) {
			return 'Leave colony'
		}
		if (passenger) {
			return 'Unload passenger'
		}
	}, ({ colonist, passenger }) => {
		if (colonist) {
			UnjoinColony(colonist)
		}
		if (passenger) {
			LoadUnitFromShipToColony(colony, passenger)
		}
	})

	return {
		container,
		originalDimensions,
		unsubscribe: [
			unsubscribeClick,
			unsubscribeDragTarget
		]
	}
}

export default {
	create
}