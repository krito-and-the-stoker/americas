import * as PIXI from 'pixi.js'
import { loadTexture, range, rectangle } from 'util/util'
import Layer from './layer'
import Background from './background'
import Context from 'view/ui/context'
import Events from 'view/ui/events'

let container = null
let context = null
let dialog = null
let currentScreen = null
let units = null
let terrain = null
let permanent = null
let notifications = null
let info = null

let layer = null

// TODO: get rid of get becuase fugly ://
const get = () => ({
	container,
	dialog,
	context,
	permanent,
	layer,
	notifications
})

const hitTest = coords => layer.app.renderer.plugins.interaction.hitTest(new PIXI.Point(coords.x, coords.y), layer.app.stage)
let currentEvent = null
const openScreen = (screen, event) => {
	if (currentScreen) {
		closeScreen()
	}
	currentScreen = screen
	currentEvent = event
	layer.app.stage.addChild(screen)
	layer.app.stage.addChild(permanent)
	layer.app.stage.addChild(context)
	layer.app.stage.removeChild(notifications)
	layer.app.stage.removeChild(container)
	layer.app.stage.removeChild(dialog)
	Background.hide()
	Events.trigger(event.name, event.arg)
}

const closeScreen = () => {
	if (currentScreen) {	
		Events.trigger(currentEvent.name, currentEvent.arg)
		Context.cancelAll()
		layer.app.stage.removeChild(currentScreen)
		layer.app.stage.addChild(container)
		layer.app.stage.addChild(permanent)
		layer.app.stage.addChild(notifications)
		layer.app.stage.addChild(context)
		layer.app.stage.addChild(dialog)
		Background.show()
	}
	currentScreen = null
	currentEvent = null
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

const add = {
	dialog: element => dialog.addChild(element)
}

const remove = {
	dialog: element => dialog.removeChild(element)
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
	notifications = new PIXI.Container()

	container.addChild(terrain)
	container.addChild(units)
	layer.app.stage.addChild(container)
	layer.app.stage.addChild(permanent)
	layer.app.stage.addChild(notifications)
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
	get,
	add,
	remove
}