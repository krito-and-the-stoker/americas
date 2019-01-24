import * as PIXI from 'pixi.js'
import Tween from '../../util/tween'

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
import Dialog from '../../view/ui/dialog'
import Record from '../../util/record'
import PathFinder from '../../util/pathFinder'
import MapEntity from '../../entity/map'
import MoveTo from '../../command/moveTo'
import TriggerEvent from '../../command/triggerEvent'
import Tile from '../../entity/tile'

const selectTarget = (unit, context) => {
	const colonies = Record.getAll('colony').filter(colony => {
		const tile = MapEntity.tile(colony.mapCoordinates)
		return Tile.diagonalNeighbors(tile).some(tile => tile.domain === 'sea')
	})
	const colonyOptions = colonies.map(colony => colony.name)
	return Dialog.createIndependent('Where do you wish us to go?', ['Stay here', ...colonyOptions, 'Where you came from'],
		null,
		{
			context,
			paused: false
		})
		.then(decision => {
			if (decision === 0) {
				return
			}
			if (decision === colonyOptions.length + 1) {
				Commander.scheduleBehind(unit.commander, America.create(unit))
				Commander.scheduleBehind(unit.commander, TriggerEvent.create('notification', { type: 'america', unit: unit }))
			} else {						
				const colony = colonies[decision - 1]
				const tile = MapEntity.tile(colony.mapCoordinates)
				const path = PathFinder.findHighSeas(tile)
				Unit.update.mapCoordinates(unit, path[path.length - 1].mapCoordinates)
				Commander.scheduleBehind(unit.commander, America.create(unit))
				Commander.scheduleBehind(unit.commander, MoveTo.create(unit, colony.mapCoordinates))
				Commander.scheduleBehind(unit.commander, TriggerEvent.create('notification', { type: 'arrive', unit: unit, colony }))
			}
	})
}

const create = closeFn => {
	const container = {
		ships: new PIXI.Container(),
		units: new PIXI.Container(),
		dialog: new PIXI.Container(),
	}
	container.dialog.y = 0
	container.dialog.x = 0


	const shipPositions = Util.range(20).map(index => ({
		x: -index * 128,
		y: 0,
		taken: false
	}))

	const landPositions = Util.range(20).map(index => ({
		x: index * 64,
		y: 0,
		taken: false
	}))

	const unsibscribeClose = Europe.listen.units(units => () => {
		if (!units.some(unit => unit.domain === 'sea')) {
			setTimeout(closeFn, 1000)
		}
	})

	const unsubscribeUnits = Europe.listenEach.units((unit, added) => {
		if (unit.domain === 'sea') {
			const view = Transport.create(unit)

			Click.on(view.sprite, () =>
				selectTarget(unit, container.dialog).then(() => {
					Europe.listen.units(units => {
						if (!units.some(unit => unit.domain === 'sea')) {
							setTimeout(closeFn, 1000)
						}
					})()
				}))

			const position = shipPositions.find(pos => !pos.taken)
			position.taken = unit

			view.container.x = position.x
			view.container.y = position.y
			view.container.scale.set(1.25)
			container.ships.addChild(view.container)

			if (added) {
				Tween.moveFrom(view.container, { x: - 1000, y: -300 }, 5000)
			}

			return () => {
				position.taken = false
				view.unsubscribe()
				Tween.moveTo(view.container, { x: - 1000, y: -300 }, 5000).then(() => {
					container.ships.removeChild(view.container)
				})
			}
		}

		if (unit.domain === 'land') {
			const sprite = UnitView.create(unit)

			const position = landPositions.find(pos => !pos.taken)
			position.taken = unit

			sprite.x = position.x
			sprite.y = position.y
			sprite.scale.set(2)
			container.units.addChild(sprite)
			Drag.makeDraggable(sprite, { unit })

			Tween.fadeIn(sprite, 350)

			return () => {
				position.taken = false
				container.units.removeChild(sprite)
			}
		}
	})

	const rect = { x: 0, y: -100, width: 648, height: 250}
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

	const unsubscribe = () => {
		unsubscribeDrag()
		unsubscribeUnits()
		unsibscribeClose()
	}

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