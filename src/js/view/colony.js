import * as PIXI from 'pixi.js'

import Foreground from '../render/foreground'
import Ressources from '../render/ressources'
import RenderView from '../render/view'
import Util from '../util/util'

const TILE_SIZE = 64


const MAP_COLONY_FRAME_ID = 53 

const createMapSprite = colony => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().map, Util.rectangle(MAP_COLONY_FRAME_ID)))
	sprite.x = TILE_SIZE * colony.mapCoordinates.x
	sprite.y = TILE_SIZE * colony.mapCoordinates.y
	sprite.interactive = true
	sprite.on('pointerdown', () => {
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

	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().colonyBackground))
	const backgroundScale = Math.min(RenderView.getDimensions().x / background.width, RenderView.getDimensions().y / background.height)
	background.scale.set(backgroundScale)
	screenContainer.addChild(background)

	const nameHeadline = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.x = RenderView.getDimensions().x / 2
	nameHeadline.position.y = 35
	screenContainer.addChild(nameHeadline)

	screenContainer.interactive = true
	screenContainer.on('pointerdown', () => {
		Foreground.closeScreen()
	})
	return screenContainer
}


export default {
	createMapSprite,
	createDetailScreen
}
