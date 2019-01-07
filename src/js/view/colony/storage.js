import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import Util from '../../util/util'
import Drag from '../../input/drag'
import GoodsView from '../../view/goods'
import Unit from '../../entity/unit'

const create = (colony, originalDimensions) => {
	const container = new PIXI.Container()
	const numberOfGoods = Object.keys(colony.storage).length
	const width = originalDimensions.x / numberOfGoods
	const updateAndArgs = Object.keys(colony.storage).map((good, index) => {
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
			amount: colony.storage[good],
			colony
		}
		Drag.makeDraggable(sprite, args)

		return {
			update,
			args
		}
	})

	const unsubscribe = Colony.bindStorage(colony, storage => {
		Object.values(storage).forEach((value, i) => {
			updateAndArgs[i].update(Math.floor(value))
			updateAndArgs[i].args.amount = Math.floor(value)
		})
	})

	// container.hitArea = new PIXI.Rectangle(0, originalDimensions.y - 121, originalDimensions.x, 121)
	// Drag.makeDragTarget(container, args => {
	// 	const { good, unit, amount } = args
	// 	if (good && unit) {
	// 		Colony.updateStorage(colony, good, amount)
	// 		Unit.loadGoods(unit, good, -amount)
	// 		return false
	// 	}

	// 	return false
	// })

	return {
		container,
		unsubscribe
	}
}

export default { create }