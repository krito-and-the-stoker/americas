import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util.js'
import Layer from './layer.js'

let container = null

const get = () => ({
	container
})

const updateCoords = ({ x, y }) => {
	container.x = x
	container.y = y
}

const updateScale = (newScale) => {
	container.scale.set(newScale, newScale)	
}

const initialize = async () => {
	// create layer
	const layer = new Layer({
		transparent: true
	})

	// load texture
	const [map] = await loadTexture('images/map.png')

	// create 50 random textures
	const numberOfSprites = 50
	console.log(`Creating foreground with ${numberOfSprites} sprites`)
	container = new PIXI.Container()
	const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
	tiles.forEach((tile, index) => {
		tile.vx = 2*(Math.random() - .5)
		tile.vy = 2*(Math.random() - .5)
		tile.x = Math.round(layer.width * Math.random())
		tile.y = Math.round(layer.height * Math.random())
		tile.exactX = tile.x
		tile.exactY = tile.y
		container.addChild(tile)
	})

	layer.app.stage.addChild(container)

	layer.app.ticker.add(() => {
		tiles.forEach(tile => {
			tile.exactX += tile.vx
			tile.exactY += tile.vy
			tile.x = Math.round(tile.exactX)
			tile.y = Math.round(tile.exactY)
		})
	})
}


export default {
	initialize,
	updateCoords,
	updateScale,
	get
}