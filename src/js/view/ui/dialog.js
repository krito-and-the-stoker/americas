import * as PIXI from 'pixi.js'

import Foreground from '../../render/foreground'
import RenderView from '../../render/view'
import Time from '../../timeline/time'
import Util from '../../util/util'
import Click from '../../input/click'
import Resources from '../../render/resources'
import Text from 'src/render/text'


const images = {
	scout: {
		x: - 300,
		y: 0,
		placement: 'front'
	}
}

let currentDialog = null

let initialized = false
const initialize = () => {
	currentDialog = Promise.resolve()
}

const dialogs = {
	discovered: {
		msg: 'Land Ahoy!\nYou have discovered a new continent',
		options: ['Splendid!', 'Marvellous!', 'What a surprise!'],
		image: 'scout'
	},
	unload: {
		msg: 'Do you want to disembark here?',
		options: ['make landfall', 'stay on board']
	},
	europe: {
		msg: 'Do you want to set sail for europe?',
		options: ['yes, steady as she goes!', 'no, let us remain here.']
	},
}

const welcome = () => new Promise(resolve => {	
	const container = Foreground.get().dialog
	const sprite = Resources.sprite('welcome')
	sprite.anchor.set(1, 0.5)
	const original = {
		x: sprite.width,
		y: sprite.height
	}
	container.addChild(sprite)
	const unsubscribe = RenderView.updateWhenResized(({ dimensions }) => {
		const scale = Math.min(original.x / dimensions.x, original.y / dimensions.y)
		sprite.scale.set(0.35 * dimensions.x / original.x)
		sprite.x = dimensions.x
		sprite.y = dimensions.y / 2
	})

	Click.on(sprite, () => {
		unsubscribe()
		container.removeChild(sprite)
		resolve()
	})
})

const show = dialogName => {
	const dialog = dialogs[dialogName]
	return create(dialog.msg, dialog.options, dialog.image)
}

const createIndependent = (message, options, image = null, params = {}) => {
	return new Promise(resolve => {
		let sprite = null
		if (image) {
			sprite = Resources.sprite(image)
			sprite.anchor.set(0.5)
			sprite.position.x = RenderView.getCenter().x + images[image].x
			sprite.position.y = RenderView.getCenter().y + images[image].y
		}
		const plane9 = new PIXI.mesh.NineSlicePlane(Resources.texture('status'), 100, 100, 100, 100)

		let optionTexts = []
		const container = params.context || Foreground.get().dialog
		const text = Text.create(message, {
			fontSize: 24,
			fill: 0x000000,
		})
		container.addChild(plane9)
		if (sprite) {
			container.addChild(sprite)
		}
		container.addChild(text)
		text.anchor.set(0.5)
		text.position.x = RenderView.getCenter().x
		text.position.y = RenderView.getCenter().y - 50

		const destroy = () => {
			container.removeChild(text)
			container.removeChild(plane9)
			if (sprite) {
				container.removeChild(sprite)
			}
			optionTexts.forEach(optionText => container.removeChild(optionText))
			if (params.pause) {
				Time.resume()
			}
		}

		plane9.height = 300 + 80 + (options.length + 1) * 30
		plane9.width = 200 + text.width
		optionTexts = options.map((msg, index) => {
			const optionText = Text.create(msg, {
				fontSize: 24,
				fill: 0x000000,
			})
			optionText.anchor.set(0.5)
			optionText.position.x = RenderView.getCenter().x
			optionText.position.y = RenderView.getCenter().y - plane9.height / 2 + 250 + 30*index
			optionText.interactive = true
			optionText.buttonMode = true
			if (optionText.width > plane9.width + 100) {
				plane9.width = optionText.width + 100
			}
			Click.on(optionText, () => {
				destroy()
				resolve(index)
			})
			container.addChild(optionText)
			return optionText
		})
		plane9.position.x = RenderView.getCenter().x - plane9.width / 2
		plane9.position.y = RenderView.getCenter().y - plane9.height / 2 + 30
		text.position.y = RenderView.getCenter().y - plane9.height / 2 + 160

		if (params.pause) {
			Time.pause()
		}
	})
}


const create = (message, options, image) => {
	currentDialog = currentDialog.then(() => createIndependent(message, options, image, { pause: true }))
	return currentDialog
}

export default {
	initialize,
	create,
	createIndependent,
	show,
	welcome
}