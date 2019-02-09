import * as PIXI from 'pixi.js'

import Messages from 'data/tutorial'

import Util from 'util/util'
import Record from 'util/record'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Click from 'input/click'

import Foreground from 'render/foreground'
import Resources from 'render/resources'
import RenderView from 'render/view'
import Text from 'render/text'

import Dialog from 'view/ui/dialog'


const messageFunctions = {
	select: {
		subscribe: () => Events.listen('select', () => {
			markDone('select')
		})
	},
	move: {
		subscribe: () => Record.getAll('unit').map(unit =>
			Unit.listen.mapCoordinates(unit, coords => {
				if (coords.x < unit.tile.mapCoordinates.x) {
					markDone('move')
				}
			}))
	},
	landfall: {
		subscribe: () => Events.listen('discovery', () => {
			markDone('landfall')
		})		
	},
	disembark: {
		subscribe: () => Events.listen('disembark', () => {
			markDone('disembark')
		})		
	},
	colony: {
		subscribe: () => Events.listen('found', () => {
			markDone('colony')
		})		
	},
	immigration: {
		subscribe: () => Events.listen('immigration', () => {
			markDone('immigration')
		})
	}
}

const prepareMessage = message => {
	message.valid = true
	message.shown = false
	const funcs = messageFunctions[message.name]
	if (funcs) {
		Object.keys(funcs).forEach(key => {
			message[key] = funcs[key]
		})
	}

	return message
}
const messages = Messages.map(prepareMessage)

const originalDimensions = sprite => ({
	x: sprite.texture.baseTexture.realWidth,
	y: sprite.texture.baseTexture.realHeight
})
const height = (sprite) => sprite.width * originalDimensions(sprite).y / originalDimensions(sprite).x

const videoDialog = ({ text, video }) => {
	const closePlane = new PIXI.Container()
	const frameView = Resources.sprite('tutorialFrame')

	const videoControls = video ? video.texture.baseTexture.source : null
	videoControls.loop = true
	videoControls.currentTime = 0
	videoControls.play()

	const textView = Text.create(text)

	const unsubscribeDimensions = RenderView.listen.dimensions(dimensions => {
		closePlane.hitArea = new PIXI.Rectangle(0, 0, dimensions.x, dimensions.y)

		frameView.width = 0.55 * dimensions.x
		frameView.height = height(frameView)
		frameView.x = (dimensions.x - frameView.width) / 2
		frameView.y = (dimensions.y - frameView.height) / 2		

		video.width = 0.52 * dimensions.x
		video.height = height(video)
		video.x = frameView.x + 0.015 * dimensions.x
		video.y = frameView.y + 0.015 * dimensions.y

		textView.style = {
			...textView.style,
			wordWrap: true,
			wordWrapWidth: 0.48 * dimensions.x
		}
		textView.x = (dimensions.x - textView.width) / 2
		textView.y = video.y + video.height + 0.03 * dimensions.y
	})

	Foreground.add.dialog(closePlane)
	Foreground.add.dialog(video)
	Foreground.add.dialog(frameView)
	Foreground.add.dialog(textView)

	Time.pause()

	Click.on(closePlane, () => {
		unsubscribeDimensions()
		videoControls.pause()

		Foreground.remove.dialog(closePlane)
		Foreground.remove.dialog(video)
		Foreground.remove.dialog(frameView)
		Foreground.remove.dialog(textView)

		Time.resume()
	})
}

const show = message => {
	message.shown = true

	if (message.type === 'video') {	
		videoDialog({
			text: message.text,
			video: message.video,
		})
	} else {	
		Dialog.create({
			text: message.text,
			type: message.type,
			pause: true
		})
	}
}

const prepare = message => {
	if (message.type === 'video') {
		message.video = Resources.video(message.name)
	}
}

const init = () => {
	if (!Record.getGlobal('tutorial')) {
		Record.setGlobal('tutorial', {})
	}

	messages
		.filter(msg => msg.subscribe)
		.forEach(msg => {
			msg.unsubscribe = msg.subscribe()
		})
}
const markDone = name => {
	Record.getGlobal('tutorial')[name] = true
	const message = messages.find(msg => msg.name === name)
	Util.execute(message.unsubscribe)
	message.valid = false
}
const isDone = name => Record.getGlobal('tutorial')[name]
const nextMessage = () => {
	const message = messages.filter(msg => !isDone(msg.name)).find(msg => msg.preconditions.every(pre => isDone(pre)))
	prepare(message)
	return message
}
// const stop = () => messages.map(msg => msg.name).forEach(markDone)
const nextMessageTime = (currentTime, msg) => currentTime + 1000 * (msg.wait ? (msg.shown ? msg.wait.repeat : msg.wait.initial) : 0)
const initialize = () => {
	init()

	let msg = nextMessage()
	let eta = 0
	Time.schedule({ update: currentTime => {
		if (!msg.valid) {
			msg = nextMessage()
			eta = nextMessageTime(currentTime, msg)
		}

		if (!eta) {
			eta = nextMessageTime(currentTime, msg)
		}

		if (currentTime >= eta) {
			show(msg)
			eta = nextMessageTime(currentTime, msg)
		}

		return true
	} })
}

export default { initialize }