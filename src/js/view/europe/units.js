import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import UnitView from '../../view/unit'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Unit from '../../entity/unit'
import GoodsView from '../../view/goods'
import Europe from '../../entity/europe'
import Commander from '../../command/commander'
import America from '../../command/america'
import Transport from '../../view/transport'
import Util from '../../util/util'
import LoadUnitFromShipToEurope from '../../action/loadUnitFromShipToEurope'

const create = closeFn => {
	const container = {
		ships: new PIXI.Container(),
		units: new PIXI.Container()
	}


	const unsubscribe = Europe.listen.units(units => {
		const ships = units.filter(unit => unit.domain === 'sea')
		const landUnits = units.filter(unit => unit.domain === 'land')
		const unsubscribeShips = Util.mergeFunctions(ships.map(Transport.create).map((view, index) => {
			Click.on(view.sprite, () => {
				Commander.scheduleBehind(view.unit.commander, America.create(view.unit))
				if (ships.length === 1) {
					closeFn()
				}
			})
			view.container.x = index * 64 * 2
			view.container.y = 0
			container.ships.addChild(view.container)

			return () => {			
				view.unsubscribe()
				container.ships.removeChild(view.container)
			}
		}))

		const rect = {x: 0, y: -100, width: 648, height: 250}
		const leaveShipZone = new PIXI.Container()
		leaveShipZone.hitArea = new PIXI.Rectangle(
			rect.x,
			rect.y,
			rect.width,
			rect.height)
		container.units.addChild(leaveShipZone)

		const unsubscribeDrag = Drag.makeDragTarget(leaveShipZone, args => {
			if (args.passenger) {
				LoadUnitFromShipToEurope(args.passenger)
			}
		})

		const unsubscribeUnits = Util.mergeFunctions(landUnits.map((unit, index) => {
			const sprite = UnitView.create(unit)
			sprite.scale.set(2)
			sprite.x = index * 64
			sprite.y = 0
			container.units.addChild(sprite)
			Drag.makeDraggable(sprite, { unit })

			return () => {
				container.units.removeChild(sprite)
			}
		}))

		return () => {
			unsubscribeShips()
			unsubscribeDrag()
			unsubscribeUnits()
		}
	})

	// const graphics = new PIXI.Graphics()
	// graphics.beginFill(0x9b59b6) // Purple

	// // Draw a rectangle
	// window.rect = window.rect || {
	// 	x: 240,
	// 	y: 150,
	// 	width: 75,
	// 	height: 75
	// }
	// window.originalDimensions = {
	// 	x: 1920,
	// 	y: 1080
	// }
	// const rect = {x: 0, y: -100, width: 648, height: 250}
	// graphics.drawRect(window.rect.x, window.rect.y, window.rect.width, window.rect.height)
	// graphics.endFill()
	// container.units.addChild(graphics)

	return {
		container,
		unsubscribe
	}
}

export default { create }