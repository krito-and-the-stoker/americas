import * as PIXI from 'pixi.js'
import Goods from '../../data/goods.json'
import Buildings from '../../data/buildings.json'
import Building from '../../entity/building'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import Drag from '../../input/drag'
import Colonist from '../../entity/colonist'
import Colony from '../../entity/colony'
import ProductionView from '../../view/production'
import Commander from '../../command/commander'
import ColonistView from '../../view/colony/colonist'

import JoinColony from '../../action/joinColony'
import BecomeColonist from '../../action/becomeColonist'

const TILE_SIZE = 64

const createBuilding = (colony, name) => {
	const container = {
		building: new PIXI.Container(),
		colonists: new PIXI.Container()
	}
	const frame = Building.frame(colony, name)

	if (!frame && frame !== 0) {
		return {
			container,
			unsubscribe: () => {}
		}
	}
	const x = 128 * frame
	const y = 0
	const width = Buildings[name].width * 128
	const height = 128
	const rectangle = new PIXI.Rectangle(x, y, width, height)

	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().buildings, rectangle))
	container.building.addChild(sprite)

	const unsubscribeDrag = Drag.makeDragTarget(sprite, args => {
		const { unit } = args
		if (!args.colonist && !unit) {
			return false
		}

		if (colony.disbanded) {
			return false
		}

		if (unit && !Commander.isIdle(unit.commander)) {
			return false
		}


		let colonist = args.colonist
		if (!Colony.canEmploy(colony, name, unit ? unit.expert : colonist.expert)) {
			return false
		}
		if (unit) {
			if (unit.colonist) {
				JoinColony(colony, unit.colonist)
			} else {
				BecomeColonist(colony, unit)
			}
			colonist = unit.colonist
		}

		if (colonist) {
			Colonist.beginColonyWork(colonist, name)
			return true
		}
		return false
	})

	const createColonistView = (productionBonus, colonist, work, expert) => {
		if (work && work.building === name) {
			const colonistSprite = ColonistView.create(colonist)
			colonistSprite.x = work.position * 128 / 3
			colonistSprite.y = 20
			colonistSprite.scale.set(1.5)
			container.colonists.addChild(colonistSprite)

			const production = Building.production(colony, name, colonist)
			if (production) {
				const productionSprites = ProductionView.create(production.good || production.type, production.amount, TILE_SIZE / 2)
				productionSprites.forEach(s => {
					s.position.x += work.position * 128 / 3
					s.position.y += 20 + TILE_SIZE
					container.colonists.addChild(s)
				})
				return () => {
					productionSprites.forEach(s => container.colonists.removeChild(s))
					container.colonists.removeChild(colonistSprite)
				}
			}
			return () => {
				container.colonists.removeChild(colonistSprite)
			}
		}
	}

	const unsubscribeColonists = Colony.listen.productionBonus(colony, productionBonus => 
		Colony.listen.colonists(colony, colonists => Util.mergeFunctions(colonists.map(colonist =>
			Colonist.listen.work(colonist, work =>
				Colonist.listen.expert(colonist, expert => createColonistView(productionBonus, colonist, work, expert)))))))


	const unsubscribe = () => {
		unsubscribeColonists()
		unsubscribeDrag()
	}

	return {
		container,
		unsubscribe
	}
}

const create = colony => {
	const container = {
		buildings: new PIXI.Container(),
		colonists: new PIXI.Container()
	}

	const unsubscribe = Colony.listen.buildings(colony, buildings => {
		const cols = 4
		let position = {
			x: 0,
			y: 0
		}
		return Util.mergeFunctions(Object.keys(buildings)
			.map(name => {
				const building = createBuilding(colony, name)
				building.container.building.x = position.x * 128 + 100
				building.container.building.y = position.y * 128 + 100
				building.container.colonists.x = position.x * 128 + 100
				building.container.colonists.y = position.y * 128 + 100
				position.x += Buildings[name].width
				if (position.x > cols) {
					position.x = 0
					position.y += 1
				}
				container.buildings.addChild(building.container.building)
				container.colonists.addChild(building.container.colonists)

				return () => {
					building.unsubscribe()
					container.buildings.removeChild(building.container)
					container.colonists.removeChild(building.container.colonists)
				}
			}))
	})

	container.buildings.scale.set(1.3)
	container.colonists.scale.set(1.3)

	return {
		container,
		unsubscribe
	}
}

export default { create }



// ARMORY
// ARSENAL
// CATHEDRAL
// CHURCH
// COLLEGE
// CUSTOM HOUSE
// DRYDOCKS
// FORT
// FORTRESS
// MAGAZINE
// NEWSPAPER
// PRINTING PRESS
// SCHOOLHOUSE
// SHIPYARD
// STABLES
// STOCKADE
// UNIVERSITY