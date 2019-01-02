import * as PIXI from 'pixi.js'

import Foreground from '../render/foreground'
import Background from '../render/background'
import Ressources from '../render/ressources'
import RenderView from '../render/view'
import MapEntity from '../entity/map'
import Util from '../util/util'
import Tile from '../entity/tile'

const TILE_SIZE = 64


const MAP_COLONY_FRAME_ID = 53 

const createMapSprite = colony => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
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
	const originalDimensions = {
		x: background.width,
		y: background.height
	}
	screenContainer.addChild(background)

	const nameHeadline = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	screenContainer.addChild(nameHeadline)

	const tilesContainer = new PIXI.Container()
	const center = MapEntity.tile(colony.mapCoordinates)
	const tiles = [center].concat(Tile.diagonalNeighbors(center))
	tiles.map(tile => {
		const position = {
			x: TILE_SIZE * (1 + tile.mapCoordinates.x - center.mapCoordinates.x),
			y: TILE_SIZE * (1 + tile.mapCoordinates.y - center.mapCoordinates.y)
		}
		Background.createSpritesFromTile(tile).forEach(sprite => {
			sprite.position.x = position.x
			sprite.position.y = position.y
			tilesContainer.addChild(sprite)
		})
	})
	const colonySprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
	colonySprite.position.x = TILE_SIZE
	colonySprite.position.y = TILE_SIZE
	tilesContainer.addChild(colonySprite)
	screenContainer.addChild(tilesContainer)

	RenderView.updateWhenResized(({ dimensions }) => {
		const backgroundScale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		tilesContainer.position.x = (originalDimensions.x - 765) * backgroundScale
		tilesContainer.scale.set(backgroundScale * 765 / (3 * TILE_SIZE))
		background.scale.set(backgroundScale)
		nameHeadline.position.x = dimensions.x / 2
	})

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
