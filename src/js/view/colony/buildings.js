import * as PIXI from 'pixi.js'
import Building from 'entity/building'
import Production from 'entity/production'
import Resources from 'render/resources'
import Util from 'util/util'
import Drag from 'input/drag'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import ProductionView from 'view/production'
import Commander from 'command/commander'
import ColonistView from 'view/colony/colonist'

import JoinColony from 'action/joinColony'
import BecomeColonist from 'action/becomeColonist'

const TILE_SIZE = 64

const createBuilding = (colony, building) => {
	const container = {
		building: new PIXI.Container(),
		colonists: new PIXI.Container()
	}

	const name = building.name
	const rectangle = Building.rectangle(colony, building)
	if (!rectangle || !building.position) {		
		return null
	}
	const sprite = Resources.sprite('buildings', { rectangle })
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

	const createColonistView = (productionBonus, colonist, work) => {
		if (work && work.building === name) {
			const colonistSprite = ColonistView.create(colonist)
			colonistSprite.x = work.position * 128 / 3
			colonistSprite.y = 20
			colonistSprite.scale.set(1.5)
			container.colonists.addChild(colonistSprite)

			const production = Production.production(colony, name, colonist)
			if (production) {
				const productionSprites = ProductionView.create(production.good, Math.round(production.amount), TILE_SIZE / 2)
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
				Colonist.listen.expert(colonist, () => createColonistView(productionBonus, colonist, work)))))))


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

	const unsubscribe = Colony.listen.buildings(colony, buildings =>
		Util.mergeFunctions(Object.values(buildings).map(building => {
			const buildingView = createBuilding(colony, building)
			if (buildingView) {			
				buildingView.container.building.x = building.position.x * 128
				buildingView.container.building.y = building.position.y * 128
				buildingView.container.colonists.x = building.position.x * 128
				buildingView.container.colonists.y = building.position.y * 128
				container.buildings.addChild(buildingView.container.building)
				container.colonists.addChild(buildingView.container.colonists)

				return () => {
					buildingView.unsubscribe()
					container.buildings.removeChild(buildingView.container.building)
					container.colonists.removeChild(buildingView.container.colonists)
				}
			}
			if (building.name === 'fortifications' && building.level > 0) {
				const sprite = Resources.sprite([null, 'stockade', 'fort', 'fortress'][building.level])
				container.buildings.addChild(sprite)
				return () => {
					container.buildings.removeChild(sprite)
				}
			}
		})))

	return {
		container,
		unsubscribe
	}
}

export default { create }