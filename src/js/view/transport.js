import * as PIXI from 'pixi.js'

import Util from 'util/util'

import UnitView from 'view/unit'
import Unit from 'entity/unit'
import Drag from 'input/drag'
import GoodsView from 'view/goods'
import Storage from 'entity/storage'

import BuyFromEurope from 'interaction/buyFromEurope'
import LoadFromColonyToShip from 'interaction/loadFromColonyToShip'
import LoadUnitFromShipToShip from 'interaction/loadUnitFromShipToShip'
import LoadBetweenShips from 'interaction/loadBetweenShips'
import LoadUnitToShip from 'interaction/loadUnitToShip'

const create = unit => {
	const container = new PIXI.Container()
	const view = UnitView.create(unit)
	const sprite = view.sprite
	sprite.scale.set(2)
	container.addChild(sprite)

	const unsubscribeDrag = Drag.makeDragTarget(sprite, args => {
		const { good, amount, buyFromEurope, colony, passenger } = args
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
				LoadBetweenShips(fromUnit, unit, pack)
				return false
			}
		}
		if (fromUnit && fromUnit !== unit) {
			LoadUnitToShip(unit, fromUnit)
			return false
		}

		if (passenger) {
			LoadUnitFromShipToShip(unit, passenger)
		}

		return false
	})

	const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
	greyScaleFilter.blackAndWhite()

	const unsubscribePassengersAndStorage = Unit.listen.passengers(unit, passengers => {
		let index = {
			x: 0,
			y: 0
		}

		const unsubscribePassengers = passengers.map(passenger => {
			const view = UnitView.create(passenger)
			const sprite = view.sprite
			sprite.x = index.x * 1.4 * 32 - 8
			sprite.y = index.y * 1.2 * 32 + 80
			sprite.scale.set(1.4)
			container.addChild(sprite)
			const unsubscribeDrag = Drag.makeDraggable(sprite, { passenger }, 'Unload passanger')

			index.x += 1
			if (index.x >= 2) {
				index.x = 0
				index.y += 1
			}

			return [
				view.unsubscribe,
				unsubscribeDrag,
				() => container.removeChild(sprite),
			]
		})

		const unsubscribeStorage = Storage.listen(unit.storage, storage => {
			const goods = Storage.split(storage)
			let storageIndex = {
				x: index.x,
				y: index.y
			}
			return goods.map(pack => {
				const view = GoodsView.create(pack)
				view.sprite.x = storageIndex.x * 1.4 * 32 - 8
				view.sprite.y = storageIndex.y * 1.2 * 32 + 80
				view.sprite.scale.set(1.4)
				if (pack.amount < 100) {
					view.sprite.filters = [greyScaleFilter]
				}
				storageIndex.x += 1
				if (storageIndex.x >= 2) {
					storageIndex.x = 0
					storageIndex.y += 1
				}
				const unsubscribeDrag = Drag.makeDraggable(view.sprite, { good: pack.good, amount: pack.amount, unit }, 'Unload cargo')
				container.addChild(view.sprite)

				return () => {
					Util.execute(unsubscribeDrag)
					container.removeChild(view.sprite)
				}
			})
		})

		return [
			unsubscribePassengers,
			unsubscribeStorage,
		]
	})



	const unsubscribe = [
		view.unsubscribe,
		unsubscribeDrag,
		unsubscribePassengersAndStorage,
	]

	return {
		container,
		sprite,
		unsubscribe,
		unit
	}
}


export default { create }