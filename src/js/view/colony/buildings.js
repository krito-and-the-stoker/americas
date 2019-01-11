import * as PIXI from 'pixi.js'
import Buildings from '../../data/buildings'
import Ressources from '../../render/ressources'
import Util from '../../util/util'
import Drag from '../../input/drag'
import Colonist from '../../entity/colonist'
import Colony from '../../entity/colony'
import ProductionView from '../../view/production'
import Commander from '../../command/commander'
import JoinColony from '../../action/joinColony'

const TILE_SIZE = 64

const createBuilding = (colony, name) => {
	const container = new PIXI.Container()
	const frame = Buildings[name].frame
	const x = 128 * (frame % 4)
	const y = 128 * Math.floor(frame / 4)
	const width = Buildings[name].width * 128
	const height = 128
	const rectangle = new PIXI.Rectangle(x, y, width, height)

	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().buildings, rectangle))
	container.addChild(sprite)

	Drag.makeDragTarget(sprite, args => {
		const { unit } = args
		if (!args.colonist && !unit) {
			return
		}

		if (unit && !Commander.isIdle(unit.commander)) {
			return false
		}
		const colonist = args.colonist || unit.colonist || Colonist.create(unit)
		if (unit) {
			JoinColony(colony, colonist)
		}

		if (colonist && Colony.canEmploy(colony, name)) {
			Colonist.beginColonyWork(colonist, name)
			return true
		}
		return false
	})

	const unsubscribe = Colony.bindColonists(colony, colonists => {
		const colonistsSprites = []
		
		const cleanupWork = Util.mergeFunctions(colonists.map(colonist => {
			return Colonist.listen.work(colonist, work => {
				if (work && work.building === name) {
					colonist.sprite.x = work.position * 128 / 3
					colonist.sprite.y = 36
					container.addChild(colonist.sprite)
					colonistsSprites.push(colonist.sprite)

					const good = Buildings[name].production ? Buildings[name].production.good : null
					if (good) {					
						const productionSprites = ProductionView.create(good, Buildings[name].production.amount, TILE_SIZE / 2)
						productionSprites.forEach(s => {
							s.position.x += work.position * 128 / 3
							s.position.y += 36 + 0.5 * TILE_SIZE
							s.scale.set(0.5)
							container.addChild(s)
						})
						return () => {
							productionSprites.forEach(s => container.removeChild(s))
						}
					}
				}
			})
		}))

		return () => {
			colonistsSprites.forEach(s => container.removeChild(s))
			cleanupWork()
		}
	})

	return {
		container,
		unsubscribe
	}
}

const create = colony => {
	const container = new PIXI.Container()

	const cols = 4
	let position = {
		x: 0,
		y: 0
	}
	const unsubscribe = Util.mergeFunctions(Object.values(Buildings.places)
		.map(name => {
			const building = createBuilding(colony, name)
			building.container.x = position.x * 128 + 400 / 1.6
			building.container.y = position.y * 128 + 200 / 1.4
			position.x += Buildings[name].width
			if (position.x > cols) {
				position.x = 0
				position.y += 1
			}
			container.addChild(building.container)
			return building.unsubscribe
		}))

	container.scale.set(1.3)

	return {
		container,
		unsubscribe
	}
}

export default { create }



// ARMORY
// ARSENAL
// BLACKSMITH'S HOUSE
// BLACKSMITHS'S SHOP
// CARPENTER'S SHOP
// CATHEDRAL
// CHURCH
// CIGAR FACTORY
// COAT FACTORY
// COLLEGE
// CUSTOM HOUSE
// DOCKS
// DRYDOCKS
// FORT
// FORTRESS
// FUR TRADER'S HOUSE
// FUR TRADING POST 
// IRON WORKS
// LUMBER MILL
// MAGAZINE
// NEWSPAPER
// PRINTING PRESS
// RUM DISTILLER'S HOUSE
// RUM DISTILLERY
// RUM FACTORY
// SCHOOLHOUSE
// SHIPYARD
// STABLES
// STOCKADE
// TEXTILE MILL
// TOBACCONIST'S HOUSE
// TOBACCONIST'S SHOP
// TOWN HALL
// UNIVERSITY
// WAREHOUSE
// WAREHOUSE EXPANSIONS
// WEAVER'S HOUSE
// WEAVER'S SHOP