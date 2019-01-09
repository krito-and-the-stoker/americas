import * as PIXI from 'pixi.js'

import Foreground from '../render/foreground'
import Background from '../render/background'
import Ressources from '../render/ressources'
import RenderView from '../render/view'
import MapEntity from '../entity/map'
import Util from '../util/util'
import Tile from '../entity/tile'
import ProductionView from '../view/production'
import Colony from '../entity/colony'
import Click from '../input/click'
import UnitView from '../view/unit'

import ColonyBackground from './colony/background'
import ColonyTiles from './colony/tiles'
import ColonyHeadline from './colony/headline'
import ColonyStorage from './colony/storage'
import ColonyDocks from './colony/docks'
import ColonyBuildings from './colony/buildings'


const TILE_SIZE = 64


const MAP_COLONY_FRAME_ID = 53 


const createMapSprite = colony => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
	sprite.x = TILE_SIZE * colony.mapCoordinates.x
	sprite.y = TILE_SIZE * colony.mapCoordinates.y
	sprite.interactive = true
	Click.on(sprite, () => {
		colony.screen = createDetailScreen(colony)
		Foreground.openScreen(colony.screen)
	})
	const text = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 22,
		fill: 0xffffff,
		align: 'center'
	})
	text.position.x = sprite.x + TILE_SIZE / 2
	text.position.y = sprite.y + TILE_SIZE + 10
	text.anchor.set(0.5)
	Foreground.addTerrain(text)
	Foreground.addTerrain(sprite)
	return sprite
}




const createDetailScreen = colony => {
	const screenContainer = new PIXI.Container()
	const colonyWoodBackground = new PIXI.extras.TilingSprite(Ressources.get().colonyWoodBackground, RenderView.getDimensions().x, RenderView.getDimensions().y)
	
	const background = ColonyBackground.create(colony)
	const originalDimensions = background.originalDimensions

	const tiles = ColonyTiles.create(colony, originalDimensions)
	const headline = ColonyHeadline.create(colony, originalDimensions)
	const storage = ColonyStorage.create(colony, originalDimensions)
	const docks = ColonyDocks.create(colony, () => closeScreen(), originalDimensions)
	const buildings = ColonyBuildings.create(colony)

	screenContainer.addChild(colonyWoodBackground)
	screenContainer.addChild(background.container)
	screenContainer.addChild(tiles.container)
	screenContainer.addChild(docks.container)
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
	const closeScreen = () => {
		tiles.unsubscribe()
		storage.unsubscribe()
		docks.unsubscribe()
		buildings.unsubscribe()
		unsubscribeResize()
		Foreground.closeScreen()
	}
	Click.on(colonyWoodBackground, closeScreen)
	return screenContainer
}


export default {
	createMapSprite,
	createDetailScreen
}
