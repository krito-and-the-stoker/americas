import * as PIXI from 'pixi.js'

import UnitView from '../view/unit'
import Unit from '../entity/unit'
import Drag from '../input/drag'
import Europe from '../entity/europe'
import GoodsView from '../view/goods'
import Colony from '../entity/colony'
import Market from '../entity/market'
import Util from '../util/util'

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
		if (fromUnit && fromUnit !== unit) {
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


	const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
	greyScaleFilter.blackAndWhite()
	const unsubscribeStorage = Unit.listenStorage(unit, storage => {
		let index = {
			x: 0,
			y: 0
		}
		const goods = GoodsView.splitStorage(unit.storage)
		return Util.mergeFunctions(goods.map(pack => {
			const view = GoodsView.create(pack)
			view.sprite.x = index.x * 1.4 * 32 - 8
			view.sprite.y = index.y * 1.2 * 32 + 80
			view.sprite.visible = true
			view.sprite.scale.set(1.4)
			if (pack.amount < 100) {
				view.sprite.filters = [greyScaleFilter]
			}
			index.x += 1
			if (index.x >= 2) {
				index.x = 0
				index.y += 1
			}
			Drag.makeDraggable(view.sprite, { good: pack.good, amount: pack.amount, unit })
			container.addChild(view.sprite)

			return () => {
				container.removeChild(view.sprite)
			}
		}))
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