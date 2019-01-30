import * as PIXI from 'pixi.js'

import Foreground from 'render/foreground'
import Background from 'render/background'
import Resources from 'render/resources'
import RenderView from 'render/view'
import MapEntity from 'entity/map'
import Util from 'util/util'
import Tile from 'entity/tile'
import ProductionView from 'view/production'
import Colony from 'entity/colony'
import Click from 'input/click'
import UnitView from 'view/unit'
import Events from 'view/ui/events'

import ColonyBackground from './background'
import ColonyTiles from './tiles'
import ColonyHeadline from './headline'
import ColonyStorage from './storage'
import ColonyUnits from './units'
import ColonyBuildings from './buildings'
import ColonyProduction from './production'
import ColonyConstruction from './construction'
import ColonyLiberty from './liberty'
import ColonyInfo from './info'


const close = () => {
	Foreground.closeScreen()
}

const open = colony => {
	Foreground.openScreen(create(colony), { name: 'colony', colony })
}

const create = colony => {
	const container = new PIXI.Container()
	const colonyWoodBackground = new PIXI.extras.TilingSprite(Resources.texture('colonyWoodBackground'), RenderView.getDimensions().x, RenderView.getDimensions().y)
	
	const background = ColonyBackground.create(colony)
	const originalDimensions = background.originalDimensions

	const tiles = ColonyTiles.create(colony, originalDimensions)
	const headline = ColonyHeadline.create(colony, originalDimensions)
	const storage = ColonyStorage.create(colony, originalDimensions)
	const units = ColonyUnits.create(colony, () => close(), originalDimensions)
	const buildings = ColonyBuildings.create(colony)
	const production = ColonyProduction.create(colony)
	const construction = ColonyConstruction.create(colony, originalDimensions)
	const liberty = ColonyLiberty.create(colony)
	const info = ColonyInfo.create(originalDimensions)

	container.addChild(colonyWoodBackground)
	container.addChild(background.container)
	container.addChild(liberty.container)
	container.addChild(headline.container)
	container.addChild(production.container)
	container.addChild(storage.container)
	container.addChild(buildings.container.buildings)
	container.addChild(construction.container.panel)
	container.addChild(tiles.container)
	container.addChild(buildings.container.colonists)
	container.addChild(units.container)
	container.addChild(construction.container.menu)
	container.addChild(info.container)

	const mask = new PIXI.Graphics()
	mask.beginFill(0xFFFFFF)
	mask.drawRect(0, 0, originalDimensions.x, originalDimensions.y)
	units.container.mask = mask
	container.addChild(mask)

	const unsubscribeResize = RenderView.updateWhenResized(({ dimensions }) => {
		const scaleX = dimensions.x / originalDimensions.x
		const scaleY = dimensions.y / originalDimensions.y
		const scale = 0.9 * Math.min(scaleX, scaleY)
		container.scale.set(scale)
		container.position.x = (dimensions.x - scale * originalDimensions.x) / 2
		container.position.y = (dimensions.y - scale * originalDimensions.y) / 2
		colonyWoodBackground.width = dimensions.x / scale
		colonyWoodBackground.height = dimensions.y / scale
		colonyWoodBackground.x = -container.x / scale
		colonyWoodBackground.y = -container.y / scale
	})

	colonyWoodBackground.interactive = true
	const unsubscribe = () => {
		tiles.unsubscribe()
		storage.unsubscribe()
		units.unsubscribe()
		buildings.unsubscribe()
		production.unsubscribe()
		liberty.unsubscribe()
		construction.unsubscribe()
		info.unsubscribe()
		unsubscribeResize()
	}
	Click.on(colonyWoodBackground, close)
	
	return {
		container,
		unsubscribe
	}
}


export default {
	open,
	close
}
