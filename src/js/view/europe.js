import * as PIXI from 'pixi.js'

import Ressources from '../render/ressources'
import RenderView from '../render/view'
import Foreground from '../render/foreground'

let screen = null

const open = () => {
	Foreground.openScreen(screen)
}

const close = () => {
	Foreground.closeScreen()
}

const initialize = () => {
	const screenContainer = new PIXI.Container()

	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().europeBackground))
	const backgroundScale = Math.max(RenderView.getDimensions().x / background.width, RenderView.getDimensions().y / background.height)
	background.scale.set(backgroundScale)
	screenContainer.addChild(background)

	const nameHeadline = new PIXI.Text('London', {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.x = RenderView.getDimensions().x / 2
	nameHeadline.position.y = 35
	screenContainer.addChild(nameHeadline)

	screenContainer.interactive = true
	screenContainer.on('pointerdown', close)
	screen = screenContainer
}

export default {
	initialize,
	open,
	close
}