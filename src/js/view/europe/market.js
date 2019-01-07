import * as PIXI from 'pixi.js'

import Goods from '../../data/goods'
import GoodsView from '../../view/goods'
import Drag from '../../input/drag'
import Europe from '../../entity/europe'
import Unit from '../../entity/unit'


const create = (originalDimensions) => {
	const container = new PIXI.Container()

	Object.values(Goods.types).map((good, index) => {	
		const { sprite } = GoodsView.create({ good })
		sprite.x = Math.round(index * (originalDimensions.x + 11) / Object.values(Goods.types).length)
		sprite.y = originalDimensions.y - 121
		sprite.scale.set(1.7)
		container.addChild(sprite)

		const price =	 new PIXI.Text(`${4}/${6}`, {
			fontFamily: 'Times New Roman',
			fontSize: 32,
			fill: 0xffffff,
			align: 'center'
		})

		const width = originalDimensions.x / Object.values(Goods.types).length
		price.anchor.set(0.5)
		price.position.x = (index + 0.5) * width
		price.position.y = originalDimensions.y - width / 4
		container.addChild(price)

		let args = {
			good: good,
			amount: 100,
			buyFromEurope: true
		}
		Drag.makeDraggable(sprite, args)	
	})

	const dragTarget = new PIXI.Container()
	container.addChild(dragTarget)
	dragTarget.hitArea = new PIXI.Rectangle(0, originalDimensions.y - 121, originalDimensions.x, 121)
	const unsubscribe = Drag.makeDragTarget(dragTarget, args => {
		const { good, unit, amount } = args
		if (good && unit) {
			Europe.sell(good, amount)
			Unit.loadGoods(unit, good, -amount)
			return false
		}

		return false
	})

	return {
		container,
		unsubscribe
	}
}

export default { create }