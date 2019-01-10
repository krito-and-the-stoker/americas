import * as PIXI from 'pixi.js'

import UnitView from '../view/unit'
import Unit from '../entity/unit'
import Drag from '../input/drag'
import Europe from '../entity/europe'
import GoodsView from '../view/goods'
import Colony from '../entity/colony'
import Market from '../entity/market'
import Util from '../util/util'
import Storage from '../entity/storage'

import BuyFromEurope from '../action/buyFromEurope'
import LoadFromColonyToShip from '../action/loadFromColonyToShip'
import LoadBetweenShips from '../action/loadBetweenShips'
import LoadUnitToShip from '../action/loadUnitToShip'

const create = unit => {
	const container = new PIXI.Container()
	const sprite = UnitView.create(unit)
	sprite.scale.set(2)
	container.addChild(sprite)

	const unsubscribeDrag = Drag.makeDragTarget(sprite, args => {
		const { good, amount, buyFromEurope, colony } = args
		const fromUnit = args.unit
		if (good) {
			const pack = { good, amount }
			if (buyFromEurope) {
				BuyFromEurope(unit, pack)
				return false
			}
			if (colony) {
				LoadFromColonyToShip(colony, unit, pack)
				return false
			}
			if (args.unit && args.unit !== unit) {
				LoadBetweenShips(src, dest, pack)
				return false
			}
		}
		if (fromUnit && fromUnit !== unit) {
			LoadUnitToShip(unit, fromUnit)
			return false
		}

		return false
	})


	const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
	greyScaleFilter.blackAndWhite()
	const unsubscribeStorage = Storage.listen(unit.storage, storage => {
		let index = {
			x: 0,
			y: 0
		}
		const goods = Storage.split(unit.storage)
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