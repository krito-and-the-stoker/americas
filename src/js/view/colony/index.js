import * as PIXI from 'pixi.js'

import Foreground from '../../render/foreground'
import Background from '../../render/background'
import Ressources from '../../render/ressources'
import RenderView from '../../render/view'
import MapEntity from '../../entity/map'
import Util from '../../util/util'
import Tile from '../../entity/tile'
import ProductionView from '../../view/production'
import Colony from '../../entity/colony'
import Click from '../../input/click'
import UnitView from '../../view/unit'

import ColonyBackground from './background'
import ColonyTiles from './tiles'
import ColonyHeadline from './headline'
import ColonyStorage from './storage'
import ColonyUnits from './units'
import ColonyBuildings from './buildings'


let currentScreen = null
const close = () => {
	if (currentScreen) {	
		currentScreen.unsubscribe()
		Foreground.closeScreen()
	}
}

const open = colony => {
	currentScreen = create(colony)
}

const create = colony => {
	const screenContainer = new PIXI.Container()
	const colonyWoodBackground = new PIXI.extras.TilingSprite(Ressources.get().colonyWoodBackground, RenderView.getDimensions().x, RenderView.getDimensions().y)
	
	const background = ColonyBackground.create(colony)
	const originalDimensions = background.originalDimensions

	const tiles = ColonyTiles.create(colony, originalDimensions)
	const headline = ColonyHeadline.create(colony, originalDimensions)
	const storage = ColonyStorage.create(colony, originalDimensions)
	const units = ColonyUnits.create(colony, () => closeScreen(), originalDimensions)
	const buildings = ColonyBuildings.create(colony)

	screenContainer.addChild(colonyWoodBackground)
	screenContainer.addChild(background.container)
	screenContainer.addChild(tiles.container)
	screenContainer.addChild(units.container)
	screenContainer.addChild(headline.container)
	screenContainer.addChild(storage.container)
	screenContainer.addChild(buildings.container)


	const unsubscribeResize = RenderView.updateWhenResized(({ dimensions }) => {
		const scaleX = dimensions.x / originalDimensions.x
		const scaleY = dimensions.y / originalDimensions.y
		const scale = 0.9 * Math.min(scaleX, scaleY)
		screenContainer.scale.set(scale)
		screenContainer.position.x = (dimensions.x - scale * originalDimensions.x) / 2
		screenContainer.position.y = (dimensions.y - scale * originalDimensions.y) / 2
		colonyWoodBackground.width = dimensions.x / scale
		colonyWoodBackground.height = dimensions.y / scale
		colonyWoodBackground.x = -screenContainer.x / scale
		colonyWoodBackground.y = -screenContainer.y / scale
	})

	colonyWoodBackground.interactive = true
	const unsubscribe = () => {
		tiles.unsubscribe()
		storage.unsubscribe()
		units.unsubscribe()
		buildings.unsubscribe()
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
