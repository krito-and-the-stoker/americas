import * as PIXI from 'pixi.js'
import Tween from 'util/tween'

import UnitView from 'view/unit'
import Click from 'input/click'
import Drag from 'input/drag'
import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Commander from 'command/commander'
import America from 'command/america'
import Transport from 'view/transport'
import Util from 'util/util'
import LoadUnitFromShipToEurope from 'interaction/loadUnitFromShipToEurope'
import Dialog from 'view/ui/dialog'
import Record from 'util/record'
import MapEntity from 'entity/map'
import GoTo from 'command/goTo'
import TriggerEvent from 'command/triggerEvent'
import Tile from 'entity/tile'
import Foreground from 'render/foreground'

const closeIfNoShips = () => {
	setTimeout(() => {
		const unsubscribe = Europe.listen.units(units => {
			if (units.filter(unit => unit.domain === 'sea').length === 0) {
				Foreground.closeScreen()
			}
		})
		unsubscribe()	
	}, 1000)
}

const selectTarget = unit => {
	const colonies = Record.getAll('colony').filter(colony => {
		const tile = MapEntity.tile(colony.mapCoordinates)
		return Tile.diagonalNeighbors(tile).some(tile => tile.domain === 'sea')
	}).sort((a, b) => b.colonists.length - a.colonists.length)

	const options = [{
		text: 'Where you came from',
		action: () => {
			Commander.scheduleInstead(unit.commander, America.create({ unit }))
			Commander.scheduleBehind(unit.commander, TriggerEvent.create({ name: 'notification', type: 'america', unit }))
			closeIfNoShips()
		}
	}].concat(colonies.map((colony, index) => ({
		margin: !index && colonies.length > 1,
		text: `${colony.name} (${colony.colonists.length})`,
		action: () => {
			Commander.scheduleBehind(unit.commander, GoTo.create({ unit, colony }))
			Commander.scheduleBehind(unit.commander, TriggerEvent.create({ name: 'notification', type: 'arrive', unit, colony }))
			closeIfNoShips()
		}
	}))).concat([{
		text: 'Stay here',
		default: true,
		margin: true
	}])

	Dialog.create({
		type: 'naval',
		text: 'Where do you wish us to go?',
		closeScreen: false,
		options,
	})
}

const create = () => {
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

	const unsubscribeUnits = Europe.listenEach.units((unit, added) => {
		if (unit.domain === 'sea') {

			const position = shipPositions.find(pos => !pos.taken)
			if (position) {
				const view = Transport.create(unit)

				Click.on(view.sprite, () =>
					selectTarget(unit))

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
					Util.execute(view.unsubscribe)
					Tween.moveTo(view.container, { x: - 1000, y: -300 }, 5000).then(() => {
						container.ships.removeChild(view.container)
					})
				}
			}
		}

		if (unit.domain === 'land') {
			const position = landPositions.find(pos => !pos.taken)
			if (position) {
				const view = UnitView.create(unit)
				const sprite = view.sprite

				position.taken = unit

				sprite.x = position.x
				sprite.y = position.y
				sprite.scale.set(2)
				container.units.addChild(sprite)
				Drag.makeDraggable(sprite, { unit })

				Tween.fadeIn(sprite, 350)

				return () => {
					position.taken = false
					Util.execute(view.unsubscribe)
					container.units.removeChild(sprite)
				}
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

	const unsubscribe = [
		unsubscribeDrag,
		unsubscribeUnits,
	]

	return {
		container,
		unsubscribe
	}
}

export default { create }