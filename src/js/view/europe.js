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

	const docks = DocksView.create()
	container.addChild(docks.container)

	const market = MarketView.create(originalDimensions)
	container.addChild(market.container)

	const nameHeadline = new PIXI.Text('London', {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	container.addChild(nameHeadline)

	RenderView.updateWhenResized(({ dimensions }) => {
		nameHeadline.position.x = dimensions.x / 2
		const coverScale = Math.max(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		const fitScale = Math.min(dimensions.x / originalDimensions.x, dimensions.y / originalDimensions.y)
		background.scale.set(coverScale / fitScale)
		container.scale.set(fitScale)
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