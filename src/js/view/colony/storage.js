import * as PIXI from 'pixi.js'

import Goods from '../../data/goods.json'
import Colony from '../../entity/colony'
import Util from '../../util/util'
import Drag from '../../input/drag'
import GoodsView from '../../view/goods'
import Unit from '../../entity/unit'
import Storage from '../../entity/storage'

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

		return {
			update,
			args
		}
	})

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
			Colony.updateStorage(colony, good, amount)
			Unit.loadGoods(unit, good, -amount)
			return false
		}

		return false
	})

	const unsubscribe = () => {
		unsubscribeStorage()
		unsubscribeDrag()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }