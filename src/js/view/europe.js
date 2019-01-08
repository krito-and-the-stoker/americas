import * as PIXI from 'pixi.js'

import Ressources from '../render/ressources'
import RenderView from '../render/view'
import Foreground from '../render/foreground'
import Europe from '../entity/europe'

import DocksView from './europe/docks'
import MarketView from './europe/market'

let unsubscribe = () => {}
const open = () => {
	const screen = create()
	unsubscribe = screen.unsubscribe
	Foreground.openScreen(screen.container)
}

const close = () => {
	unsubscribe()
	unsubscribe = () => {}
	Foreground.closeScreen()
}

const create = () => {
	const container = new PIXI.Container()

	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().europeBackground))
	const originalDimensions = {
		x: background.width,
		y: background.height
	}
	container.addChild(background)

	const market = MarketView.create(originalDimensions)
	container.addChild(market.container)

	const docks = DocksView.create(close)
	container.addChild(docks.container)

	const nameHeadline = new PIXI.Text('London', {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.x = originalDimensions.x / 2
	nameHeadline.position.y = 35
	container.addChild(nameHeadline)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = {
			x: dimensions.x / originalDimensions.x,
			y: dimensions.y / originalDimensions.y,
		} 
		const coverScale = Math.max(scale.x, scale.y)
		const fitScale = Math.min(scale.x, scale.y)
		background.scale.set(coverScale / fitScale)
		container.scale.set(fitScale)
		background.x = dimensions.x / fitScale - background.width
		background.y = dimensions.y / fitScale - background.height - 125
		market.container.y = originalDimensions.y * (scale.y - fitScale) / fitScale
	})

	const unsubscribe = () => {
		docks.unsubscribe()
		market.unsubscribe()
	}

	return {
		container,
		unsubscribe
	}
}

export default {
	create,
	open,
	close
}