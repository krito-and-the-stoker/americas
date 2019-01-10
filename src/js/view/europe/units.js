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

const create = (close, originalDimensions) => {
	let shipViews = []
	let landUnitsView = []
	const container = new PIXI.Container()

	console.log('create units view')
	const unsubscribeUnits = Europe.listen.units(units => {
		console.log('listening', units)
		const ships = units.filter(unit => unit.domain === 'sea')
		const landUnits = units.filter(unit => unit.domain === 'land')
		shipViews.forEach(view => {
			view.unsubscribe()
			container.removeChild(view.container)
		})
		shipViews = ships.map(Transport.create)
		shipViews.forEach((view, index) => {
			Click.on(view.sprite, () => {
				Commander.scheduleBehind(view.unit.commander, America.create(view.unit))
				if (ships.length === 1) {
					close()
				}
			})
			view.container.x = index * 64 * 2
			view.container.y = 10
			container.addChild(view.container)
		})

		landUnitsView.forEach(({ sprite }) => {
			container.removeChild(sprite)
		})
		landUnitsView = landUnits.map(unit => ({ sprite: UnitView.createColonySprite(unit), unit }))
		landUnitsView.forEach(({ sprite, unit }, index) => {
			sprite.x = originalDimensions.x - (landUnitsView.length - index) * sprite.width
			sprite.y = originalDimensions.y - 125 - sprite.height
			container.addChild(sprite)
			Drag.makeDraggable(sprite, { unit })
		})
	})



	const unsubscribe = () => {
		unsubscribeUnits()
		shipViews.forEach(view => view.unsubscribe())
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }