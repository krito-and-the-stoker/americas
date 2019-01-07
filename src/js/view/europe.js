import * as PIXI from 'pixi.js'

import Ressources from '../render/ressources'
import RenderView from '../render/view'
import Foreground from '../render/foreground'
import Europe from '../entity/europe'

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
	const originalDimensions = {
		x: background.width,
		y: background.height
	}
	screenContainer.addChild(background)

	const nameHeadline = new PIXI.Text('London', {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	screenContainer.addChild(nameHeadline)

	screenContainer.interactive = true
	screenContainer.on('pointerdown', close)
	screen = screenContainer

	RenderView.updateWhenResized(({ dimensions }) => {
		nameHeadline.position.x = dimensions.x / 2
		const backgroundScale = Math.max(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		background.scale.set(backgroundScale)		
	})
}

export default {
	initialize,
	open,
	close
}