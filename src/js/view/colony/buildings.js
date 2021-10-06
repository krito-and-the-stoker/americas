import * as PIXI from 'pixi.js'

import Buildings from 'data/buildings'
import Goods from 'data/goods'

import Util from 'util/util'

import Drag from 'input/drag'
import Click from 'input/click'

import Production from 'entity/production'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Building from 'entity/building'

import JoinColony from 'interaction/joinColony'
import BecomeColonist from 'interaction/becomeColonist'

import Resources from 'render/resources'

import ProductionView from 'view/production'

import ColonistView from 'view/colony/colonist'


const TILE_SIZE = 64

const frame = (colony, building) => Buildings[building.name].frame[colony.buildings[building.name].level]
	? Buildings[building.name].frame[colony.buildings[building.name].level] - 1
	: Buildings[building.name].frame[Buildings[building.name].frame.length - 1] - 1
const buildingRectangle = (colony, building) => {
	if (frame(colony, building) === null) {
		return null
	}

	const fr = frame(colony, building)
	const cols = 13
	const x = 128 * (fr % cols)
	const y = 128 * Math.floor(fr / cols)
	const width = Buildings[building.name].width * 128
	const height = 128
	return new PIXI.Rectangle(x, y, width, height)	
}


const createBuilding = (colony, building) => {
	const container = {
		building: new PIXI.Container(),
		colonists: new PIXI.Container()
	}

	const name = building.name
	const rectangle = buildingRectangle(colony, building)
	if (!rectangle || !building.position) {		
		return null
	}
	const sprite = Resources.sprite('buildings', { rectangle })
	container.building.addChild(sprite)

	const unsubscribeDrag = Drag.makeDragTarget(() => {
		return [sprite].concat(container.colonists.children)
	}, args => {
		const { unit, colonist } = args
		if (colony.disbanded) {
			return
		}

		if (colonist && Colony.canEmploy(colony, name, colonist.expert)) {
			return `Let colonist work in ${name}`
		}

		if (unit && unit.properties.canJoin) {
			if (Colony.canEmploy(colony, name, unit.colonist.expert)) {
				return `Join colony and start working in ${name}`
			}
		}
	}, ({ colonist, unit }) => {
		if (unit) {		
			JoinColony(colony, unit.colonist)
			Colonist.beginColonyWork(unit.colonist, name)
		}

		if (colonist) {
			Colonist.beginColonyWork(colonist, name)
		}
	})

	// TODO: Implement a nice detailed popup
	// const unsubscribeClick = Click.on(sprite, () => {
	// 	console.log(building)
	// }, `Inspect ${Building.getName(colony, building)}`)

	const createColonistView = (productionBonus, colonist, work) => {
		if (work && work.building === name) {
			const position = {
				x: work.position * 128 * Buildings[work.building].width / (Building.workspace(colony, work.building) || 1),
				y: 20
			}
			const colonistSprite = ColonistView.create(colonist)
			colonistSprite.x = position.x
			colonistSprite.y = position.y
			colonistSprite.scale.set(1.5)
			container.colonists.addChild(colonistSprite)

			const unsubscribeEducation = Colonist.listen.beingEducated(colonist, beingEducated => {
				if (beingEducated) {
					const bookSprite = Resources.sprite('map', { frame: Goods.books.id })
					bookSprite.scale.set(0.5)
					bookSprite.x = 0.5 * TILE_SIZE
					bookSprite.y = 0
					colonistSprite.addChild(bookSprite)
					return () => {
						colonistSprite.removeChild(bookSprite)
					}
				}
			})

			const production = Production.production(colony, name, colonist)
			if (production) {
				const productionSprites = ProductionView.create(production.good, Math.round(production.amount), TILE_SIZE / 2)
				productionSprites.forEach(s => {
					s.position.x += position.x
					s.position.y += position.y + TILE_SIZE
					container.colonists.addChild(s)
				})
				return [
					Colonist.listen.promotionStatus(colonist, () => {
						colonistSprite.tint = ColonistView.tint(colonist)
					}),
					() => {
						productionSprites.forEach(s => container.colonists.removeChild(s))
						container.colonists.removeChild(colonistSprite)
					},
					Click.on(colonistSprite, () => ColonistView.createDetailView(colonist), 'View details'),
					Drag.makeDraggable(colonistSprite, { colonist }, 'Move to field or other building to change production')
				]
			}
			
			return [
				() => {
					container.colonists.removeChild(colonistSprite)
				},
				Click.on(colonistSprite, () => ColonistView.createDetailView(colonist), 'View details'),
				Drag.makeDraggable(colonistSprite, { colonist }, 'Move to field or other building to change production'),
				unsubscribeEducation
			]
		}
	}

	const unsubscribeColonists = Colony.listen.productionBonus(colony, productionBonus => 
		Colony.listen.colonists(colony, colonists =>
			colonists.map(colonist =>
				Colonist.listen.work(colonist, work =>
					Colonist.listen.expert(colonist, () =>
						Colonist.listen.promotionStatus(colonist, () =>
							createColonistView(productionBonus, colonist, work)))))))

	const unsubscribe = [
		unsubscribeColonists,
		unsubscribeDrag,
		// unsubscribeClick
	]

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
		Object.values(buildings).map(building => {
			const buildingView = createBuilding(colony, building)
			if (buildingView) {
				buildingView.container.building.x = building.position.x * 128
				buildingView.container.building.y = building.position.y * 128
				buildingView.container.colonists.x = building.position.x * 128
				buildingView.container.colonists.y = building.position.y * 128
				container.buildings.addChild(buildingView.container.building)
				container.colonists.addChild(buildingView.container.colonists)

				return () => {
					Util.execute(buildingView.unsubscribe)
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
		}))

	return {
		container,
		unsubscribe
	}
}

export default { create }