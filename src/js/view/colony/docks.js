import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import UnitView from '../../view/unit'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Unit from '../../entity/unit'

const create = (colony, closeScreen) => {
	let unitSprites = []
	const container = new PIXI.Container()
	const unsubscribe = Colony.bindUnits(colony, units => {
		unitSprites.forEach(s => container.removeChild(s))
		unitSprites = units
			.filter(unit => unit.domain === 'sea')
			.map((unit, index) => {
				const sprite = UnitView.createColonySprite(unit)
				sprite.x = index * sprite.width
				sprite.y = 10
				
				Click.on(sprite, () => {
					closeScreen()
					UnitView.activateUnit(unit)
				})

				Drag.makeDragTarget(sprite, args => {
					const { good, colony, amount } = args
					const fromUnit = args.unit
					if (good) {
						if (colony) {
							Unit.loadGoods(unit, good, amount)
							Colony.updateStorage(colony, good, -amount)
							return false
						}
						if (args.unit) {
							Unit.loadGoods(unit, good, amount)
							Unit.loadGoods(fromUnit, good, -amount)
							return false
						}
					}

					return false
				})

				container.addChild(sprite)

				return sprite
			})
	})

	return {
		container,
		unsubscribe
	}
}

export default { create }