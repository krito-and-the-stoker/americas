import * as PIXI from 'pixi.js'

import Ressources from '../../render/ressources'
import RenderView from '../../render/view'
import Foreground from '../../render/foreground'
import Europe from '../../entity/europe'
import Treasure from '../../entity/treasure'
import Unit from '../../entity/unit'
import Events from '../../view/ui/events'

import Button from '../../view/ui/button'
import Dialog from '../../view/ui/dialog'

import UnitsView from './units'
import MarketView from './market'

let unsubscribe = () => {}
const open = () => {
	const screen = create()
	unsubscribe = screen.unsubscribe
	Foreground.openScreen(screen.container, { name: 'europeScreen' })
}

const close = () => {
	unsubscribe()
	unsubscribe = () => {}
	Foreground.closeScreen()
}

const create = () => {
	const container = new PIXI.Container()
	const normalContainer = new PIXI.Container()
	const backgroundContainer = new PIXI.Container
	container.addChild(backgroundContainer)
	container.addChild(normalContainer)

	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().europeBackground))
	const originalDimensions = {
		x: background.width,
		y: background.height
	}
	backgroundContainer.addChild(background)

	const market = MarketView.create(originalDimensions)
	backgroundContainer.addChild(market.container)

	const units = UnitsView.create(close, originalDimensions)
	normalContainer.addChild(units.container.ships)
	normalContainer.addChild(units.container.units)

	const nameHeadline = new PIXI.Text('London', {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.x = originalDimensions.x / 2
	nameHeadline.position.y = 35
	normalContainer.addChild(nameHeadline)

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
	normalContainer.addChild(recruitButton)

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
	normalContainer.addChild(purchaseButton)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = {
			x: dimensions.x / originalDimensions.x,
			y: dimensions.y / originalDimensions.y,
		} 
		const coverScale = Math.max(scale.x, scale.y)

		backgroundContainer.scale.set(coverScale)
		background.x = dimensions.x / coverScale - background.width
		background.y = dimensions.y / coverScale - background.height - 123 * scale.x / coverScale
		market.container.y = dimensions.y / coverScale
		market.container.scale.set(scale.x / coverScale)

		normalContainer.scale.set(coverScale)
		units.container.units.x = Math.max(dimensions.x / coverScale - 0.4 * background.width, 64)
		units.container.units.y = dimensions.y / coverScale - (123 * scale.x + 128 + 20) / coverScale
		units.container.ships.x = 10
		units.container.ships.y = dimensions.y / coverScale - (123 * scale.x + 256 + 40) / coverScale

		nameHeadline.x = dimensions.x / (2 *coverScale)
		recruitButton.x = dimensions.x / coverScale - recruitButton.width - 20
		purchaseButton.x = dimensions.x / coverScale - purchaseButton.width - 20
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