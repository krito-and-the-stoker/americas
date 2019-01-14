import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import UnitView from '../../view/unit'
import Click from '../../input/click'
import Drag from '../../input/drag'
import Unit from '../../entity/unit'
import GoodsView from '../../view/goods'
import Europe from '../../entity/europe'
import Commander from '../../command/commander'
import America from '../../command/america'
import Transport from '../../view/transport'
import Util from '../../util/util'

const create = closeFn => {
	const container = {
		ships: new PIXI.Container(),
		units: new PIXI.Container()
	}


	const unsubscribe = Europe.listen.units(units => {
		const ships = units.filter(unit => unit.domain === 'sea')
		const landUnits = units.filter(unit => unit.domain === 'land')
		const unsubscribeShips = Util.mergeFunctions(ships.map(Transport.create).map((view, index) => {
			Click.on(view.sprite, () => {
				Commander.scheduleBehind(view.unit.commander, America.create(view.unit))
				if (ships.length === 1) {
					closeFn()
				}
			})
			view.container.x = index * 64 * 2
			view.container.y = 0
			container.ships.addChild(view.container)

			return () => {			
				view.unsubscribe()
				container.ships.removeChild(view.container)
			}
		}))

		const unsubscribeUnits = Util.mergeFunctions(landUnits.map((unit, index) => {
			const sprite = UnitView.create(unit)
			sprite.scale.set(2)
			sprite.hitArea = new PIXI.Rectangle(32, 0, 64, 128)
			sprite.x = index * 64
			sprite.y = 0
			container.units.addChild(sprite)
			Drag.makeDraggable(sprite, { unit })

			return () => {
				container.units.removeChild(sprite)
			}
		}))

		return () => {
			unsubscribeShips()
			unsubscribeUnits()
		}
	})


	return {
		container,
		unsubscribe
	}
}

export default { create }