import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util.js'
import Layer from './layer.js'

let container = null
let layer = null

const get = () => ({
	container
})

const add = sprite => {
	container.addChild(sprite)
}

const updateCoords = ({ x, y }) => {
	container.x = x
	container.y = y
}

const updateScale = (newScale) => {
	container.scale.set(newScale, newScale)	
}

const initialize = async () => {
	layer = new Layer({
		transparent: true
	})

	// create 50 random textures
	// const numberOfSprites = 50
	// console.log(`Creating foreground with ${numberOfSprites} sprites`)
	container = new PIXI.Container()
	// const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
	// tiles.forEach((tile, index) => {
	// 	tile.vx = 2*(Math.random() - .5)
	// 	tile.vy = 2*(Math.random() - .5)
	// 	tile.x = Math.round(layer.width * Math.random())
	// 	tile.y = Math.round(layer.height * Math.random())
	// 	tile.exactX = tile.x
	// 	tile.exactY = tile.y
	// 	container.addChild(tile)
	// })

	layer.app.stage.addChild(container)
	layer.app.stop()
}

const doRenderWork = () => layer.app.render()


export default {
	initialize,
	updateCoords,
	updateScale,
	doRenderWork,
	add,
	get
}