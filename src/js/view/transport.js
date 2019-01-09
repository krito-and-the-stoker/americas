import * as PIXI from 'pixi.js'

import UnitView from '../view/unit'
import Unit from '../entity/unit'
import Drag from '../input/drag'
import Europe from '../entity/europe'
import GoodsView from '../view/goods'
import Colony from '../entity/colony'
import Market from '../entity/market'

const create = unit => {
	const container = new PIXI.Container()
	const sprite = UnitView.createColonySprite(unit)
	container.addChild(sprite)

	const unsubscribeDrag = Drag.makeDragTarget(sprite, args => {
		const { good, amount, buyFromEurope, colony } = args
		const fromUnit = args.unit
		if (good) {
			if (buyFromEurope) {
				let boughtAmount = Market.buy(good, amount)
				if (amount > 0) {
					Unit.loadGoods(unit, good, boughtAmount)
				}
				return false
			}
			if (colony) {
				Unit.loadGoods(unit, good, amount)
				Colony.updateStorage(colony, good, -amount)
				return false
			}
			if (args.unit && args.unit !== unit) {
				Unit.loadGoods(unit, good, amount)
				Unit.loadGoods(fromUnit, good, -amount)
				return false
			}
		}
		if (fromUnit) {
			Unit.loadUnit(unit, fromUnit)
			if (Europe.hasUnit(fromUnit)) {
				Europe.leave(fromUnit)
			}
			if (fromUnit.colony) {
				Colony.leave(fromUnit.colony, fromUnit)
			}
			return false
		}

		return false
	})

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

	const unsubscribeStorage = Unit.listenStorage(unit, storage => {
		const numberOfGoods = goodsViews.filter(view => storage[view.good]).length
		args.forEach(arg => arg.amount = storage[arg.good])
		let index = {
			x: 0,
			y: 0
		}
		goodsViews.forEach(view => {
			view.update(storage[view.good])
			if (storage[view.good]) {
				view.sprite.x = index.x * 1.4 * 32 - 8
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

	const unsubscribe = () => {
		unsubscribeDrag()
		unsubscribeStorage()
	}

	return {
		container,
		sprite,
		unsubscribe,
		unit
	}
}


export default { create }