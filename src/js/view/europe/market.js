import * as PIXI from 'pixi.js'

import Goods from '../../data/goods'
import GoodsView from '../../view/goods'
import Drag from '../../input/drag'
import Europe from '../../entity/europe'
import Unit from '../../entity/unit'
import Ressources from '../../render/ressources'
import Market from '../../entity/market'
import SellInEurope from '../../action/sellInEurope'
import Util from '../../util/util'
import Binding from '../../util/binding'


const create = (originalDimensions) => {
	const container = new PIXI.Container()

	const goodsBackground = new PIXI.Sprite(new PIXI.Texture(Ressources.get().goodsBackground))
	goodsBackground.y = -123
	container.addChild(goodsBackground)

	const priceViews = Object.values(Goods.types).map((good, index) => {	
		const { sprite } = GoodsView.create({ good })
		sprite.x = Math.round(index * (originalDimensions.x + 11) / Object.values(Goods.types).length)
		sprite.y = -119
		sprite.scale.set(1.7)
		container.addChild(sprite)

		const bid = Market.bid(good)
		const ask = Market.ask(good)
		const price =	 new PIXI.Text(`${bid}/${ask}`, {
			fontFamily: 'Times New Roman',
			fontSize: 32,
			fill: 0xffffff,
			align: 'center'
		})

		const width = originalDimensions.x / Object.values(Goods.types).length
		price.anchor.set(0.5)
		price.position.x = (index + 0.5) * width
		price.position.y = -width / 4
		container.addChild(price)

		let args = {
			good: good,
			amount: 100,
			buyFromEurope: true
		}
		Drag.makeDraggable(sprite, args)	

		const unsubscribe = () => {
			container.removeChild(sprite)
			container.removeChild(price)
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

	const dragTarget = new PIXI.Container()
	container.addChild(dragTarget)
	dragTarget.hitArea = new PIXI.Rectangle(0, -119, originalDimensions.x, 119)
	const unsubscribeDragTarget = Drag.makeDragTarget(dragTarget, args => {
		const { good, unit, amount } = args
		if (good && unit) {
			SellInEurope(unit, {good, amount })
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