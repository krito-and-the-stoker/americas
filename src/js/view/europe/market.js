import * as PIXI from 'pixi.js'

import Goods from 'data/goods'
import GoodsView from 'view/goods'
import Drag from 'input/drag'
import Resources from 'render/resources'
import Market from 'entity/market'
import SellInEurope from 'action/sellInEurope'
import Util from 'util/util'
import Binding from 'util/binding'
import Text from 'render/text'


const create = (originalDimensions) => {
	const container = {
		goods: new PIXI.Container(),
		pricing: new PIXI.Container()
	}

	const goodsBackground = Resources.sprite('goodsBackground')
	goodsBackground.y = -123
	container.goods.addChild(goodsBackground)

	const priceViews = Object.values(Goods.types).map((good, index) => {	
		const { sprite } = GoodsView.create({ good })
		sprite.x = Math.round(index * (originalDimensions.x + 11) / Object.values(Goods.types).length)
		sprite.y = -119
		sprite.scale.set(1.7)
		container.goods.addChild(sprite)

		const bid = Market.bid(good)
		const ask = Market.ask(good)
		const price =	 Text.create(`${bid}/${ask}`)

		const width = originalDimensions.x / Object.values(Goods.types).length
		price.anchor.set(0.5)
		price.position.x = (index + 0.5) * width
		price.position.y = -width / 4
		container.goods.addChild(price)

		let args = {
			good: good,
			amount: 100,
			buyFromEurope: true
		}
		Drag.makeDraggable(sprite, args)	

		const unsubscribe = () => {
			container.goods.removeChild(sprite)
			container.goods.removeChild(price)
		}

		return {
			good,
			price,
			unsubscribe
		}
	})

	const unsubscribePriceViews = Util.mergeFunctions(priceViews.map(view => view.unsubscribe))
	const perGoodMapping = Object.values(Goods.types).map(good => [good, () => Market.bid(good)])
	const unsubscribeMarket = Util.mergeFunctions(perGoodMapping.map(([good, mapping]) => 
		Market.listen.europe(Binding.map(bid => {
			const ask = Market.ask(good)
			priceViews.find(view => view.good === good).price.text = `${bid}/${ask}`
		}, mapping))))

	const text = Text.create('', {
		fontSize: 36
	})
	container.pricing.addChild(text)

	const dragTarget = new PIXI.Container()
	container.goods.addChild(dragTarget)
	dragTarget.hitArea = new PIXI.Rectangle(0, -119, originalDimensions.x, 119)
	const unsubscribeDragTarget = Drag.makeDragTarget(dragTarget, args => {
		const { good, unit, amount } = args
		if (good && unit) {
			SellInEurope(unit, { good, amount })
			const rate = Market.bid(good)
			const price = rate * amount
			text.text = `Sold ${amount} ${good} at ${rate}\nTotal: ${price}`
			text.x = originalDimensions.x / 2 - text.width / 2
			return false
		}

		return false
	})

	const unsubscribe = () => {
		unsubscribeMarket()
		unsubscribeDragTarget()
		unsubscribePriceViews()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }