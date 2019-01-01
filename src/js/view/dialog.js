import * as PIXI from 'pixi.js'

import Foreground from '../render/foreground'
import RenderView from '../render/view'
import Time from '../timeline/time'
import Util from '../util/util'


const images = {
	scout: {
		x: - 300,
		y: 0,
		png: () => pngs[0],
		placement: 'front'
	}
}

let pngs = null
let currentDialog = Promise.resolve(0)

let slice = null
const initialize = async () => {
	[slice] = await Util.loadTexture('images/schriftrolle-nineslice.png')
	pngs = await Util.loadTexture('images/scout.png')
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
	}
}

const show = dialogName => {
	const dialog = dialogs[dialogName]
	return create(dialog.msg, dialog.options, dialog.image)
}


const create = (message, options, image = null) => {
	currentDialog = currentDialog.then(() => new Promise(resolve => {
		let sprite = null
		if (image && images[image]) {
			sprite = new PIXI.Sprite(new PIXI.Texture(images[image].png()))
			sprite.anchor.set(0.5)
			sprite.position.x = RenderView.getCenter().x + images[image].x
			sprite.position.y = RenderView.getCenter().y + images[image].y
		}
		const plane9 = new PIXI.mesh.NineSlicePlane(new PIXI.Texture(slice), 160, 160, 160, 160);

		let optionTexts = []
		const menu = Foreground.get().menu
		const text = new PIXI.Text(message, {
			fontFamily: 'Times New Roman',
			fontSize: 24,
			fill: 0x000000,
			align: 'center'
		})
		menu.addChild(plane9)
		if (sprite) {
			menu.addChild(sprite)
		}
		menu.addChild(text)
		text.anchor.set(0.5)
		text.position.x = RenderView.getCenter().x
		text.position.y = RenderView.getCenter().y - 50

		const destroy = () => {
			menu.removeChild(text)
			menu.removeChild(plane9)
			if (sprite) {
				menu.removeChild(sprite)
			}
			optionTexts.forEach(optionText => menu.removeChild(optionText))
			Time.resume()
		}

		plane9.width = 200 + text.width
		plane9.height = 300 + 80 + (optionTexts.length + 1) * 30
		optionTexts = options.map((msg, index) => {
			const optionText = new PIXI.Text(msg, {
				fontFamily: 'Times New Roman',
				fontSize: 24,
				fill: 0x000000,
				align: 'center'
			})
			optionText.anchor.set(0.5)
			optionText.position.x = RenderView.getCenter().x
			optionText.position.y = RenderView.getCenter().y + 30 + 30*index
			optionText.interactive = true
			optionText.buttonMode = true
			if (optionText.width > plane9.width + 100) {
				plane9.width = optionText.width + 100
			}
			optionText.on('pointerdown', () => {
				destroy()
				resolve(index)
			})
			menu.addChild(optionText)
			return optionText
		})
		plane9.position.x = RenderView.getCenter().x - plane9.width / 2
		plane9.position.y = RenderView.getCenter().y - plane9.height / 2 + 30

		Time.pause()
	}))
	return currentDialog
}

export default {
	initialize,
	create,
	show
}