import * as PIXI from 'pixi.js'

import Foreground from '../render/foreground'
import RenderView from '../render/view'
import Time from '../timeline/time'
import Util from '../util/util'

let slice = null
const initialize = async () => {
	[slice] = await Util.loadTexture('images/schriftrolle-nineslice.png')
}

const create = (message, options) => {
	const plane9 = new PIXI.mesh.NineSlicePlane(new PIXI.Texture(slice), 325, 325, 325, 325);

	let optionTexts = []
	const menu = Foreground.get().menu
	const text = new PIXI.Text(message, {
		fontFamily: 'Times New Roman',
		fontSize: 24,
		fill: 0xffffff,
		align: 'center'
	})
	menu.addChild(plane9)
	menu.addChild(text)
	text.anchor.set(0.5)
	text.position.x = RenderView.getCenter().x
	text.position.y = RenderView.getCenter().y

	const destroy = () => {
		menu.removeChild(text)
		menu.removeChild(plane9)
		optionTexts.forEach(optionText => menu.removeChild(optionText))
		Time.resume()
	}

	plane9.width = 200 + text.width
	plane9.height = 300 + 80 + (optionTexts.length + 1) * 30
	optionTexts = options.map((msg, index) => {
		const optionText = new PIXI.Text(msg, {
			fontFamily: 'Times New Roman',
			fontSize: 24,
			fill: 0xffffff,
			align: 'center'
		})
		optionText.anchor.set(0.5)
		optionText.position.x = RenderView.getCenter().x
		optionText.position.y = RenderView.getCenter().y + 80 + 30*index
		optionText.interactive = true
		optionText.buttonMode = true
		if (optionText.width > plane9.width + 100) {
			plane9.width = optionText.width + 100
		}
		optionText.on('pointerdown', destroy)
		menu.addChild(optionText)
		return optionText
	})
	plane9.position.x = RenderView.getCenter().x - plane9.width / 2
	plane9.position.y = RenderView.getCenter().y - plane9.height / 2 + 30

	Time.pause()
}

export default {
	initialize,
	create
}