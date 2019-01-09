import * as PIXI from 'pixi.js'
import Buildings from '../../data/buildings'
import Ressources from '../../render/ressources'
import Util from '../../util/util'



const createBuilding = name => {
	const frame = Buildings[name].frame
	const x = 128 * (frame % 4)
	const y = 128 * Math.floor(frame / 4)
	const width = Buildings[name].width * 128
	const height = 128
	const rectangle = new PIXI.Rectangle(x, y, width, height)
	console.log(name, frame, rectangle)

	return new PIXI.Sprite(new PIXI.Texture(Ressources.get().buildings, rectangle))
}

const create = colony => {
	const container = new PIXI.Container()

	const cols = 4
	let position = {
		x: 0,
		y: 0
	}
	Object.values(Buildings.places)
		.forEach(name => {
			const sprite = createBuilding(name)
			sprite.x = position.x * 128 + 400 / 1.6
			sprite.y = position.y * 128 + 200 / 1.4
			position.x += Buildings[name].width
			if (position.x > cols) {
				position.x = 0
				position.y += 1
			}
			container.addChild(sprite)
		})

	container.scale.set(1.3)

	return {
		container
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