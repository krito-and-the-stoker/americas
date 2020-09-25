import * as PIXI from 'pixi.js'

import Goods from 'data/goods'

import Storage from 'entity/storage'
import Trade from 'entity/trade'

import Click from 'input/click'
import Drag from 'input/drag'

import GoodsView from 'view/goods'
import Icon from 'view/ui/icon'

import LoadFromShipToColony from 'interaction/loadFromShipToColony'
import UnequipUnitInColony from 'interaction/unequipUnitInColony'

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
		number.style.fontSize = 40
		container.addChild(number)

		let args = {
			good: good,
			amount: Math.min(100, colony.storage[good]),
			colony
		}

		const unsubscribe = [
			args.amount > 0 &&
				Drag.makeDraggable(sprite, args, 'Load onto transport vehicle or equip colonist'),
			Click.on(sprite, () => {
				const options = [Trade.NOTHING, Trade.IMPORT, Trade.EXPORT, Trade.BALANCE]
				colony.trade[good] = options[(colony.trade[good] + 1) % options.length]
				Trade.update(colony.trade)
			}, `Set trade options for ${good}`)
		]

		return {
			update,
			args,
			unsubscribe
		}
	})

	const unsubscribeTrade = Trade.listen(colony.trade, () => 
		Trade.goods(colony.trade).map(({ amount }, index) => {
			if (amount !== Trade.NOTHING) {				
				const icon = {
					[Trade.IMPORT]: 'import',
					[Trade.EXPORT]: 'export',
					[Trade.BALANCE]: 'balance',
				}
				const sprite = Icon.create(icon[amount])
				sprite.x = Math.round(index * (originalDimensions.x + 11) / numberOfGoods) + 55
				sprite.y = originalDimensions.y - 121
				sprite.scale.set(0.7)
				container.addChild(sprite)

				return () => {
					container.removeChild(sprite)
				}
			}
		}))

	const unsubscribeStorage = Storage.listen(colony.storage, storage => {		
		Storage.goods(storage).forEach(({ amount }, i) => {
			let color = 0xffffff
			if (amount > colony.capacity) {
				color = 0xff8800
			}
			if (!Math.floor(amount)) {
				color = 0x777777
			}
			updateAndArgs[i].update(Math.floor(amount), {
				fill: color
			})
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
		if (!good && unit && !unit.properties.cargo) {
			UnequipUnitInColony(colony, unit)
		}

		return false
	})

	const unsubscribe = [
		updateAndArgs.map(arg => arg.unsubscribe),
		unsubscribeTrade,
		unsubscribeStorage,
		unsubscribeDrag,
	]

	return {
		container,
		unsubscribe
	}
}

export default { create }