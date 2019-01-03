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

const TILE_SIZE = 64


const MAP_COLONY_FRAME_ID = 53 

const createMapSprite = colony => {
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
	sprite.x = TILE_SIZE * colony.mapCoordinates.x
	sprite.y = TILE_SIZE * colony.mapCoordinates.y
	sprite.interactive = true
	sprite.on('pointertap', () => {
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

const createDetailBackground = (colony, screenContainer) => {
	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().colonyBackground))
	screenContainer.addChild(background)

	const coastalDirection = Colony.coastalDirection(colony)
	let coast = null
	if (coastalDirection) {	
		coast = new PIXI.Sprite(new PIXI.Texture(Ressources.get().colonyScreenCoast[coastalDirection]))
		screenContainer.addChild(coast)
	}

	return {
		x: background.width,
		y: background.height
	}
}

const createDetailTiles = (colony, screenContainer, originalDimensions) => {
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
		const colonist = colony.colonists.find(colonist => colonist.worksAt && colonist.worksAt.tile == tile)
		if (colonist) {
			colonist.sprite.x = position.x
			colonist.sprite.y = position.y
			tilesContainer.addChild(colonist.sprite)
		}
	})
	const colonySprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(MAP_COLONY_FRAME_ID)))
	colonySprite.position.x = TILE_SIZE
	colonySprite.position.y = TILE_SIZE
	tilesContainer.position.x = (originalDimensions.x - 450)
	tilesContainer.scale.set(450 / (3 * TILE_SIZE))
	tilesContainer.addChild(colonySprite)
	screenContainer.addChild(tilesContainer)


	const productionGoods = Tile.colonyProductionGoods(center)
	productionGoods.forEach((good, i) => {	
		const foodSprites = ProductionView.create(Tile.production(center, good), good, 32)
		foodSprites.forEach(s => {
			s.scale.set(1.0 / productionGoods.length)
			s.position.x += TILE_SIZE
			s.position.y += TILE_SIZE + i * TILE_SIZE / productionGoods.length
			tilesContainer.addChild(s)
		})
	})
}

const createHeadline = (colony, screenContainer, originalDimensions) => {
	const nameHeadline = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	nameHeadline.position.x = originalDimensions.x / 2
	screenContainer.addChild(nameHeadline)	
}

const createStorageNumbers = (colony, screenContainer, originalDimensions) => {
	const numberOfGoods = Object.keys(colony.storage).length
	const textObjects = Object.entries(colony.storage).map(([good, amount], i) => {
		const number = new PIXI.Text(`${amount}`, {
			fontFamily: 'Times New Roman',
			fontSize: 32,
			fill: 0xffffff,
			align: 'center'
		})
		number.anchor.set(0.5)
		const width = originalDimensions.x / numberOfGoods
		number.position.x = (i + 0.5) * width
		number.position.y = originalDimensions.y - width / 4

		return number
	})
	const storageTextContainer = new PIXI.Container()
	textObjects.forEach(number => {
		storageTextContainer.addChild(number)
	})
	Colony.bindStorage(colony, storage => {
		Object.values(storage).forEach((value, i) => {
			textObjects[i].text = `${Math.floor(value)}`
		})
	})
	screenContainer.addChild(storageTextContainer)	
}

const createDetailScreen = colony => {
	const screenContainer = new PIXI.Container()

	const originalDimensions = createDetailBackground(colony, screenContainer)
	createDetailTiles(colony, screenContainer, originalDimensions)
	createHeadline(colony, screenContainer, originalDimensions)
	createStorageNumbers(colony, screenContainer, originalDimensions)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		screenContainer.scale.set(scale)
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
