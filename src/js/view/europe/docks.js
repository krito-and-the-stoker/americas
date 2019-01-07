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

const create = () => {
	let unitSprites = []
	const container = new PIXI.Container()

	let unsubscribeStorage = () => {}
	const unsubscribeUnits = Europe.bindUnits(units => {
		const ships = units.filter(unit => unit.domain === 'sea')
		unitSprites.forEach(s => container.removeChild(s))
		unitSprites = ships.map((unit, index) => {
			const sprite = UnitView.createColonySprite(unit)
			sprite.x = index * sprite.width
			sprite.y = 10
			
			Click.on(sprite, () => {
				Commander.scheduleInstead(unit.commander, America.create(unit))			
			})

			Drag.makeDragTarget(sprite, args => {
				const { good, amount, buy } = args
				const fromUnit = args.unit
				if (good) {
					if (buy) {
						Unit.loadGoods(unit, good, amount)
						Europe.buy(good, amount)
						return false
					}
					if (args.unit && args.unit !== unit) {
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

		unsubscribeStorage()
		unsubscribeStorage = ships.map((unit, unitIndex) => {
			const goodsViews = Object.entries(unit.storage)
				.map(([good, amount]) => ({ good, amount }))
				.map(GoodsView.create)

			const args = goodsViews.map(view => {
				container.addChild(view.sprite)
				const args = {
					good: view.good,
					amount: unit.storage[view.good],
					unit
				}
				Drag.makeDraggable(view.sprite, args)
				// container.addChild(view.number)

				return args
			})

			return Unit.listenStorage(unit, storage => {
				const numberOfGoods = goodsViews.filter(view => storage[view.good]).length
				args.forEach(arg => arg.amount = storage[arg.good])
				let index = {
					x: 0,
					y: 0
				}
				goodsViews.forEach(view => {
					view.update(storage[view.good])
					if (storage[view.good]) {
						view.sprite.x = index.x * 1.4 * 32 - 8 + 2 * 64 * unitIndex
						view.sprite.y = index.y * 1.2 * 32 + 80
						view.sprite.visible = true
						view.sprite.scale.set(1.4)
						// view.number.x = (index + 0.5) * 64 / numberOfGoods
						// view.number.y = 100
						// view.number.visible = true
						index.x += 1
						if (index.x >= 2) {
							index.x = 0
							index.y += 1
						}
					} else {
						view.sprite.visible = false
						// view.number.visible = false
					}
				})
			})
		}).reduce((all, fn) => () => {
			all()
			fn()
		}, () => {})
	})

	const unsubscribe = () => {
		unsubscribeUnits()
		unsubscribeStorage()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }