import * as PIXI from 'pixi.js'

import Tween from 'util/tween'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import UnitView from 'view/unit'
import UnitMapView from 'view/map/unit'
import MapView from 'view/map'
import Click from 'input/click'
import Drag from 'input/drag'
import Unit from 'entity/unit'
import GoodsView from 'view/goods'
import Transport from 'view/transport'
import Util from 'util/util'
import Binding from 'util/binding'

import EquipUnitFromShip from 'action/equipUnitFromShip'
import EquipUnitFromColony from 'action/equipUnitFromColony'


const create = (colony, closeScreen, originalDimensions) => {
	const container = new PIXI.Container()

	const shipPositions = [{
		x: 0,
		y: 550,
		taken: false
	}, {
		x: 128,
		y: 550,
		taken: false
	}, {
		x: 256,
		y: 550,
		taken: false
	}, {
		x: 3*128,
		y: 550,
		taken: false
	}, {
		x: 512,
		y: 550,
		taken: false
	}]
	const unsubscribeShips = Colony.listenEach.units(colony, (unit, added) => {
		if (unit.domain === 'sea' || unit.properties.cargo > 0) {
			const view = Transport.create(unit)
			Click.on(view.sprite, () => {
				closeScreen()
				MapView.centerAt(view.unit.mapCoordinates, 0)
				UnitMapView.select(view.unit)
			})
			const position = shipPositions.find(pos => !pos.taken)
			if (!position) {
				console.warn('could not display unit, no position left', unit)
				return
			}

			position.taken = true
			view.container.x = position.x
			view.container.y = position.y
			container.addChild(view.container)

			if (added) {
				Tween.moveFrom(view.container, { x: - 120, y: 500 }, 1500)
			}

			return () => {
				position.taken = false
				view.unsubscribe()
				Tween.moveTo(view.container, { x: - 120, y: 500 }, 1500).then(() => {
					container.removeChild(view.container)
				})
			}
		}
	})

	const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
	greyScaleFilter.blackAndWhite()

	const landPositions = Util.range(25).map(index => ({
		x: 0.9 * originalDimensions.x - index * 64,
		y: 0.9 * originalDimensions.y - 125 - 64,
		taken: false
	}))

	const drawLandUnit = (unit, added) => {
		const position = landPositions.find(pos => !pos.taken)
		if (!position) {
			console.warn('could not display unit, no position left', unit)
			return
		}
		position.taken = true

		const sprite = UnitView.create(unit)
		sprite.x = position.x
		sprite.y = position.y
		sprite.scale.set(2)
		container.addChild(sprite)

		if (added) {
			Tween.fadeIn(sprite, 1000)
		}

		Drag.makeDraggable(sprite, { unit })

		Click.on(sprite, () => {
			closeScreen()
			MapView.centerAt(unit.mapCoordinates, 0)
			UnitMapView.select(unit)
		})

		const unsubscribePioneering = Unit.listen.pioneering(unit, pioneering => {
			sprite.filters = pioneering ? [greyScaleFilter] : []
		})

		const unsubscribeDrag = Drag.makeDragTarget(sprite, args => {
			const { good, amount, colony } = args
			const fromUnit = args.unit
			if (fromUnit) {
				EquipUnitFromShip(fromUnit, unit, { good, amount })
				sprite.texture = UnitView.createTexture(unit)
			}
			if (colony) {
				EquipUnitFromColony(colony, unit, { good, amount })
				sprite.texture = UnitView.createTexture(unit)
			}

			return false
		})

		return () => {
			position.taken = false
			unsubscribePioneering()
			unsubscribeDrag()				
			container.removeChild(sprite)
		}
	}

	const unsubscribeLandUnits = Colony.listenEach.units(colony, (unit, added) => {
		if (unit.domain === 'land' && !unit.properties.cargo) {
			return Unit.listen.colonist(unit, colonist =>
				colonist ? Colonist.listen.colony(colonist, colony => 
					colony ? null : drawLandUnit(unit, added)) : drawLandUnit(unit, added))
		}
	})

	const unsubscribe = () => {
		unsubscribeLandUnits()
		unsubscribeShips()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }