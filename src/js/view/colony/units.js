import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import Colonist from '../../entity/colonist'
import UnitView from '../../view/unit'
import UnitMapView from '../../view/map/unit'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Unit from '../../entity/unit'
import GoodsView from '../../view/goods'
import Transport from '../../view/transport'
import Util from '../../util/util'
import Binding from '../../util/binding'

import EquipUnitFromShip from '../../action/equipUnitFromShip'
import EquipUnitFromColony from '../../action/equipUnitFromColony'


const create = (colony, closeScreen, originalDimensions) => {
	const container = new PIXI.Container()

	const unsubscribeUnits = Colony.listen.units(colony, units => {
		const ships = units.filter(unit => unit.domain === 'sea')
		const shipViews = ships.map(Transport.create)
		shipViews.forEach((view, index) => {
			Click.on(view.sprite, () => {
				closeScreen()
				UnitMapView.select(view.unit)
			})
			view.container.x = index * 64 * 2
			view.container.y = 10
			container.addChild(view.container)
		})

		const createLandUnitsRaw = () => {
			return Util.mergeFunctions(units
				.filter(unit => unit.domain === 'land')
				.filter(unit => !unit.colonist || !unit.colonist.colony)
				.map((unit, index, all) => {
					const shownUnits = all.length
					const sprite = UnitView.create(unit)
					sprite.x = 0.9* originalDimensions.x - (shownUnits - index - 1) * sprite.width
					sprite.y = 0.9 * originalDimensions.y - 125 - sprite.height
					sprite.scale.set(2)
					container.addChild(sprite)
					Drag.makeDraggable(sprite, { unit })

					Click.on(sprite, () => {
						closeScreen()
						UnitMapView.select(unit)
					})

					const unsubscribeDrag = Drag.makeDragTarget(sprite, args => {
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
					return () => {
						unsubscribeDrag()				
						container.removeChild(sprite)
					}
				}))
		}
		const createLandUnits = Binding.shared(createLandUnitsRaw)
		const unsubscribeLandUnits = Util.mergeFunctions(units
			.filter(unit => unit.domain === 'land')
			.map(unit => {
				return Unit.listen.colonist(unit,
					colonist => {
						if (colonist) {
							return Colonist.listen.colony(colonist, createLandUnits)
						}
						return createLandUnits()
					})
			}))

		return () => {
			shipViews.forEach(view => {
				view.unsubscribe()
				container.removeChild(view.container)
			})
			unsubscribeLandUnits()
		}
	})

	const unsubscribe = () => {
		unsubscribeUnits()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }