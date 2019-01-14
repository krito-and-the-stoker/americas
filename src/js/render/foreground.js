import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from './../util/util'
import Layer from './layer'
import Background from './background'

let container = null
let context = null
let dialog = null
let currentScreen = null
let units = null
let terrain = null
let permanent = null

let layer = null

const get = () => ({
	container,
	dialog,
	context,
	permanent,
	layer
})

const hitTest = coords => layer.app.renderer.plugins.interaction.hitTest(new PIXI.Point(coords.x, coords.y), layer.app.stage)
const openScreen = screen => {
	if (currentScreen) {
		closeScreen()
	}
	currentScreen = screen
	layer.app.stage.addChild(screen)
	layer.app.stage.addChild(permanent)
	layer.app.stage.addChild(context)
	layer.app.stage.removeChild(container)
	layer.app.stage.removeChild(dialog)
	Background.hide()
}

const closeScreen = () => {
	if (currentScreen) {	
		layer.app.stage.removeChild(currentScreen)
		layer.app.stage.addChild(container)
		layer.app.stage.addChild(permanent)
		layer.app.stage.addChild(context)
		layer.app.stage.addChild(dialog)
		Background.show()
	}
	currentScreen = null
}

const hasOpenScreen = () => currentScreen ? true : false

const addTerrain = sprite => {
	terrain.addChild(sprite)
}

const removeTerrain = sprite => {
	terrain.removeChild(sprite)
}

const addUnit = sprite => {
	units.addChild(sprite)
}

const removeUnit = sprite => {
	units.removeChild(sprite)
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
	terrain = new PIXI.Container()
	units = new PIXI.Container()
	context = new PIXI.Container()
	dialog = new PIXI.Container()
	permanent = new PIXI.Container()

	container.addChild(terrain)
	container.addChild(units)
	layer.app.stage.addChild(container)
	layer.app.stage.addChild(permanent)
	layer.app.stage.addChild(context)
	layer.app.stage.addChild(dialog)
	layer.app.stop()
}

const shutdown = () => {
	closeScreen()
	terrain.removeChildren()
	units.removeChildren()
	dialog.removeChildren()
}


const doRenderWork = () => layer.app.render()


export default {
	initialize,
	hitTest,
	shutdown,
	updateCoords,
	updateScale,
	doRenderWork,
	openScreen,
	closeScreen,
	hasOpenScreen,
	addTerrain,
	removeTerrain,
	addUnit,
	removeUnit,
	get
}