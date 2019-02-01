import * as PIXI from 'pixi.js'

import Binding from 'util/binding'

import Layer from 'render/layer'
import Background from 'render/background'

import Context from 'view/ui/context'
import Events from 'view/ui/events'

let container = null
let context = null
let dialog = null
let units = null
let terrain = null
let permanent = null
let notifications = null

let layer = null

// TODO: get rid of get because fugly ://
const get = () => ({
	container,
	dialog,
	context,
	permanent,
	layer,
	notifications
})

const update = {
	screen: value => Binding.update(state, 'screen', value)
}

const listen = {
	screen: fn => Binding.listen(state, 'screen', fn)
}

const hitTest = coords => layer.app.renderer.plugins.interaction.hitTest(new PIXI.Point(coords.x, coords.y), layer.app.stage)
const state = {
	screen: null
}

const openScreen = (view, params) => {
	if (state.screen) {
		closeScreen()
	}
	update.screen({
		...view,
		params
	})
	layer.app.stage.addChild(view.container)
	layer.app.stage.addChild(permanent)
	layer.app.stage.addChild(context)
	layer.app.stage.addChild(dialog)
	layer.app.stage.removeChild(notifications)
	layer.app.stage.removeChild(container)
	Background.hide()
	Events.trigger('openScreen', params)
}

const closeScreen = () => {
	if (state.screen) {
		if (state.screen.unsubscribe) {
			state.screen.unsubscribe()
		}
		Events.trigger('closeScreen', state.screen.params)
		Context.cancelAll()
		layer.app.stage.removeChild(state.screen.container)
		layer.app.stage.addChild(container)
		layer.app.stage.addChild(permanent)
		layer.app.stage.addChild(context)
		layer.app.stage.addChild(dialog)
		layer.app.stage.addChild(notifications)
		Background.show()
	}
	update.screen(null)
}

const hasOpenScreen = () => state.screen ? true : false

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
	layer.app.stage.addChild(context)
	layer.app.stage.addChild(dialog)
	layer.app.stage.addChild(notifications)
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
	listen,
	update,
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