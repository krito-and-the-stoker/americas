import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Binding from 'util/binding'
import Events from 'util/events'
import Tween from 'util/tween'

import Layer from 'render/layer'
import Background from 'render/background'
import Resources from 'render/resources'
import View from 'render/view'

import Context from 'view/ui/context'

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
	screen: null,
	queue: []
}

const openScreen = (view, params) => {
	if (state.screen) {
		if (state.screen.priority) {
			state.queue.push({
				view,
				params
			})
			return
		} else {
			closeScreen()
		}
	}
	update.screen({
		...view,
		params
	})
	if (!view.priority) {
		layer.app.stage.addChild(screenBackground)
		layer.app.stage.addChild(view.container)
		layer.app.stage.addChild(screenForeground)
		// layer.app.stage.removeChild(notifications)
	}
	layer.app.stage.addChild(permanent)
	layer.app.stage.addChild(context)
	layer.app.stage.addChild(dialog)
	if (view.priority) {
		layer.app.stage.addChild(screenBackground)
		layer.app.stage.addChild(view.container)
		layer.app.stage.addChild(screenForeground)
	} else {
		Background.hide()
	}
	Events.trigger('openScreen', params)
}

const closeScreen = () => {
	if (state.screen) {
		if (state.screen.unsubscribe) {
			Util.execute(state.screen.unsubscribe)
		}
		Events.trigger('closeScreen', state.screen.params)
		Context.cancelAll()
		layer.app.stage.removeChild(screenBackground)
		layer.app.stage.removeChild(state.screen.container)
		layer.app.stage.removeChild(screenForeground)
		layer.app.stage.addChild(container)
		layer.app.stage.addChild(permanent)
		layer.app.stage.addChild(context)
		layer.app.stage.addChild(dialog)
		layer.app.stage.addChild(notifications)
		Background.show()
	}
	update.screen(null)
	if (state.queue.length > 0) {
		const next = state.queue.shift()
		openScreen(next.view, next.params)
	}
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

let screenBackground, screenForeground
const initialize = () => {
	layer = new Layer({
		transparent: true
	})

	screenBackground = new PIXI.Container()
	const black = Resources.sprite('white')
	screenBackground.addChild(black)
	
	screenForeground = new PIXI.Container()

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

	Events.listen('shutdown', () => {
		shutdown()		
	})
}

const shutdown = () => {
	closeScreen()
	terrain.removeChildren()
	units.removeChildren()
	dialog.removeChildren()
}


const doRenderWork = () => layer.app.render()

let currentExceptions = []
const dimScreen = (exceptions = []) => {
	if (hasOpenScreen()) {
		Tween.fadeTo(state.screen.container, 0.6, 200)
	}

	const black = screenBackground.children[0]
	black.tint = 0x000000
	black.x = 0
	black.y = 0
	const dimensions = View.getDimensions()
	black.width = dimensions.x
	black.height = dimensions.y
	Tween.fadeIn(black, 200)


	exceptions.forEach(sprite => {
		sprite.alpha = 0
		const clone = new PIXI.Sprite(sprite.texture)
		clone.position = sprite.getGlobalPosition()
		const scale = Util.globalScale(sprite)
		clone.scale.x = scale
		clone.scale.y = scale
		screenForeground.addChild(clone)
	})

	currentExceptions = exceptions

	return screenForeground
}

const undimScreen = () => {
	if (hasOpenScreen()) {
		Tween.fadeTo(state.screen.container, 1.0, 200)
	}

	const black = screenBackground.children[0]
	Tween.fadeOut(black, 200)

	currentExceptions.forEach(sprite => {
		sprite.alpha = 1
	})
	currentExceptions = []
	screenForeground.removeChildren()
}


export default {
	initialize,
	listen,
	update,
	hitTest,
	dimScreen,
	undimScreen,
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