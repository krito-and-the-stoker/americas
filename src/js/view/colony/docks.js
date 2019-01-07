import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import UnitView from '../../view/unit'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Unit from '../../entity/unit'
import GoodsView from '../../view/goods'
import Transport from '../../view/transport'

const create = (colony, closeScreen) => {
	const container = new PIXI.Container()

	let shipViews = []
	const unsubscribeUnits = Colony.bindUnits(colony, units => {
		const ships = units.filter(unit => unit.domain === 'sea')
		shipViews.forEach(view => {
			view.unsubscribe()
			container.removeChild(view.container)
		})
		shipViews = ships.map(Transport.create)
		shipViews.forEach((view, index) => {
			Click.on(view.sprite, () => {
				closeScreen()
				UnitView.select(view.unit)
			})
			view.container.x = index * 64 * 2
			view.container.y = 10
			container.addChild(view.container)
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