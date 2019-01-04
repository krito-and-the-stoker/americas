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

import ColonyBackground from './colony/background'
import ColonyTiles from './colony/tiles'
import ColonyHeadline from './colony/headline'
import ColonyStorage from './colony/storage'


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
	Foreground.add(text)
	Foreground.add(sprite)
	return sprite
}




const createDetailScreen = colony => {
	const screenContainer = new PIXI.Container()
	const colonyWoodBackground = new PIXI.extras.TilingSprite(Ressources.get().colonyWoodBackground, RenderView.getDimensions().x, RenderView.getDimensions().y)
	screenContainer.addChild(colonyWoodBackground)

	const background = ColonyBackground.create(colony)
	screenContainer.addChild(background.container)
	const originalDimensions = background.originalDimensions

	const tiles = ColonyTiles.create(colony, originalDimensions)
	screenContainer.addChild(tiles.container)

	const headline = ColonyHeadline.create(colony, originalDimensions)
	screenContainer.addChild(headline.container)

	const storage = ColonyStorage.create(colony, originalDimensions)
	screenContainer.addChild(storage.container)


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
	Click.on(colonyWoodBackground, () => {
		tiles.unsubscribe()
		storage.unsubscribe()
		unsubscribeResize()
		Foreground.closeScreen()
	})
	return screenContainer
}


export default {
	createMapSprite,
	createDetailScreen
}
