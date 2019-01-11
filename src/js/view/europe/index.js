import * as PIXI from 'pixi.js'

import Ressources from '../../render/ressources'
import RenderView from '../../render/view'
import Foreground from '../../render/foreground'
import Europe from '../../entity/europe'
import Treasure from '../../entity/treasure'
import Unit from '../../entity/unit'

import Button from '../../view/ui/button'
import Dialog from '../../view/ui/dialog'

import UnitsView from './units'
import MarketView from './market'

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

	const units = UnitsView.create(close, originalDimensions)
	container.addChild(units.container)

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

	const recruitButton = Button.create('recruit', () => {
		const options = Europe.recruitmentOptions()
		const choices = options.map(option => option.text)
		return Dialog.createIndependent('Who would you like to recruit?',
			choices,
			null,
			{
				context: container,
				pause: false
			})
		.then(decision => {
			Europe.recruit(options[decision], decision)
		})
	})
	recruitButton.x = originalDimensions.x - recruitButton.width - 20
	recruitButton.y = originalDimensions.y / 2
	container.addChild(recruitButton)

	const purchaseButton = Button.create('purchase', () => {
		const options = Europe.purchaseOptions()
		const choices = options.map(option => option.text)
		return Dialog.createIndependent('What would you like to purchase?',
			choices,
			null,
			{
				context: container,
				pause: false
			})
		.then(decision => {
			Europe.purchase(options[decision])
		})
	})
	purchaseButton.x = originalDimensions.x - purchaseButton.width - 20
	purchaseButton.y = originalDimensions.y / 2 + 40
	container.addChild(purchaseButton)

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
		market.container.scale.set(scale.x / fitScale)
	})

	const unsubscribe = () => {
		units.unsubscribe()
		market.unsubscribe()
	}

	return {
		container,
		unsubscribe
	}
}

export default {
	open,
	close
}