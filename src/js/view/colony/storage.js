import * as PIXI from 'pixi.js'

import Goods from 'data/goods'
import Drag from 'input/drag'
import Icon from 'view/ui/icon'
import GoodsView from 'view/goods'
import Storage from 'entity/storage'
import Click from 'input/click'

import LoadFromShipToColony from 'interaction/loadFromShipToColony'

const create = (colony, originalDimensions) => {
	const container = new PIXI.Container()
	const numberOfGoods = Object.keys(Goods.types).length
	const width = originalDimensions.x / numberOfGoods
	const updateAndArgs = Storage.goods(colony.storage).map(({ good }, index) => {
		const { sprite, number, update } = GoodsView.create({ good, amount: colony.storage[good] })
		sprite.x = Math.round(index * (originalDimensions.x + 11) / numberOfGoods)
		sprite.y = originalDimensions.y - 121
		sprite.scale.set(1.7)
		container.addChild(sprite)

		number.anchor.set(0.5)
		number.position.x = (index + 0.5) * width
		number.position.y = originalDimensions.y - width / 4
		container.addChild(number)

		let args = {
			good: good,
			amount: Math.min(100, colony.storage[good]),
			colony
		}
		Drag.makeDraggable(sprite, args)
		Click.on(sprite, () => {
			colony.trade[good] = colony.trade[good] > 0 ? -1 : colony.trade[good] < 0 ? 0 : 1
			Storage.update(colony.trade)
		})

		return {
			update,
			args
		}
	})

	const unsubscribeTrade = Storage.listen(colony.trade, () => 
		Storage.goods(colony.trade).map(({ amount }, index) => {
			if (amount > 0) {
				const sprite = Icon.create('plus')
				sprite.x = Math.round(index * (originalDimensions.x + 11) / numberOfGoods) + 55
				sprite.y = originalDimensions.y - 121
				sprite.scale.set(0.7)
				container.addChild(sprite)

				return () => {
					container.removeChild(sprite)
				}
			}
			if (amount < 0) {
				const sprite = Icon.create('minus')
				sprite.x = Math.round(index * (originalDimensions.x + 11) / numberOfGoods) + 55
				sprite.y = originalDimensions.y - 121
				sprite.scale.set(0.7)
				container.addChild(sprite)

				return () => {
					container.removeChild(sprite)
				}
			}
			return () => {}
		}))

	const unsubscribeStorage = Storage.listen(colony.storage, storage => {
		Storage.goods(storage).forEach(({ amount }, i) => {
			updateAndArgs[i].update(Math.floor(amount))
			updateAndArgs[i].args.amount = Math.min(100, Math.floor(amount))
		})
	})

	const dragTarget = new PIXI.Container()
	container.addChild(dragTarget)
	dragTarget.hitArea = new PIXI.Rectangle(0, originalDimensions.y - 121, originalDimensions.x, 121)
	const unsubscribeDrag = Drag.makeDragTarget(dragTarget, args => {
		const { good, unit, amount } = args
		if (good && unit) {
			LoadFromShipToColony(colony, unit, { good, amount })
		}

		return false
	})

	const unsubscribe = () => {
		unsubscribeTrade()
		unsubscribeStorage()
		unsubscribeDrag()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }