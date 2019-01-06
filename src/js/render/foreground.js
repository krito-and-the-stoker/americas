import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util'
import Layer from './layer'
import Background from './background'

let container = null
let context = null
let menu = null
let currentScreen = null
let layer = null

const get = () => ({
	container,
	menu,
	context,
	layer
})

const hitTest = coords => layer.app.renderer.plugins.interaction.hitTest(new PIXI.Point(coords.x, coords.y), layer.app.stage)
const openScreen = screen => {
	if (currentScreen) {
		closeScreen()
	}
	currentScreen = screen
	layer.app.stage.addChild(screen)
	layer.app.stage.addChild(context)
	layer.app.stage.removeChild(container)
	layer.app.stage.removeChild(menu)
	Background.hide()
}

const closeScreen = () => {
	if (currentScreen) {	
		layer.app.stage.removeChild(currentScreen)
		layer.app.stage.addChild(container)
		layer.app.stage.addChild(context)
		layer.app.stage.addChild(menu)
		Background.show()
	}
	currentScreen = null
}

const add = sprite => {
	container.addChild(sprite)
}

const remove = sprite => {
	container.removeChild(sprite)
}

const addEventListener = (event, fn) => {
	console.log('added', event)
	container.on(event, fn)
}

const updateCoords = ({ x, y }) => {
	container.x = x
	container.y = y
}

const updateScale = (newScale) => {
	container.scale.set(newScale, newScale)	
}

const initialize = () => {
	layer = new Layer({
		transparent: true
	})

	container = new PIXI.Container()
	context = new PIXI.Container()
	menu = new PIXI.Container()

	layer.app.stage.addChild(container)
	layer.app.stage.addChild(context)
	layer.app.stage.addChild(menu)
	layer.app.stop()
}

const shutdown = () => {
	closeScreen()
	container.removeChildren()
	menu.removeChildren()
}

const doRenderWork = () => layer.app.render()


export default {
	initialize,
	hitTest,
	shutdown,
	updateCoords,
	updateScale,
	doRenderWork,
	addEventListener,
	openScreen,
	closeScreen,
	add,
	remove,
	get
}