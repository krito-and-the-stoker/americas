import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import UnitView from '../../view/unit'
import UnitMapView from '../../view/map/unit'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Unit from '../../entity/unit'
import GoodsView from '../../view/goods'
import Transport from '../../view/transport'
import Binding from '../../util/binding'

import EquipUnitFromShip from '../../action/equipUnitFromShip'
import EquipUnitFromColony from '../../action/equipUnitFromColony'


const create = (colony, closeScreen, originalDimensions) => {
	const container = new PIXI.Container()

	let shipViews = []
	let landUnitsView = []
	const unsubscribeUnits = Colony.listen.units(colony, units => {
		const ships = units.filter(unit => unit.domain === 'sea')
		const landUnits = units.filter(unit => unit.domain === 'land')
		shipViews.forEach(view => {
			view.unsubscribe()
			container.removeChild(view.container)
		})
		shipViews = ships.map(Transport.create)
		shipViews.forEach((view, index) => {
			Click.on(view.sprite, () => {
				closeScreen()
				UnitView.select(view.unit)
			})
			view.container.x = index * 64 * 2
			view.container.y = 10
			container.addChild(view.container)
		})

		landUnitsView.forEach(({ sprite }) => {
			container.removeChild(sprite)
		})
		landUnitsView = landUnits.map(unit => ({ sprite: UnitView.create(unit), unit }))
		landUnitsView.forEach(({ sprite, unit }, index) => {
			sprite.x = originalDimensions.x - (landUnitsView.length - index) * sprite.width
			sprite.y = originalDimensions.y - 125 - sprite.height
			sprite.scale.set(2)
			container.addChild(sprite)
			Drag.makeDraggable(sprite, { unit })

			Click.on(sprite, () => {
				closeScreen()
				UnitMapView.select(unit)
			})

			Drag.makeDragTarget(sprite, args => {
				const { good, amount, colony } = args
				const fromUnit = args.unit
				if (fromUnit) {
					EquipUnitFromShip(ship, unit, { good, amount })
				}
				if (colony) {
					EquipUnitFromColony(colony, unit, { good, amount })
				}

				return false
			})
		})
	})

	const unsubscribe = () => {
		unsubscribeUnits()
		shipViews.forEach(view => view.unsubscribe())
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }