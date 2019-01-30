import * as PIXI from 'pixi.js'
import RenderView from 'render/view'
import Time from 'timeline/time'
import Click from 'input/click'
import Help from 'view/help'
import Text from 'render/text'
import Treasure from 'entity/treasure'


const createTreasure = () => {
	const number = Text.create(Treasure.amount())

	number.y = 10

	let currentDimensions = null
	RenderView.updateWhenResized(({ dimensions }) => {
		number.x = dimensions.x - (number.width + 10)
		currentDimensions = dimensions
	})
	const unsubscribe = Treasure.bind(amount => {
		number.text = `Treasure: ${amount}`
		number.x = currentDimensions.x - (number.width + 10)
	})


	return {
		unsubscribe,
		number
	}
}


const createYear = () => {
	const number = Text.create(1492)

	number.y = 42

	let currentDimensions = null
	RenderView.updateWhenResized(({ dimensions }) => {
		number.x = dimensions.x - (number.width + 10)
		currentDimensions = dimensions
	})

	const unsubscribe = Time.listen.year(year => {
		number.text = `${year} A.D.`
		number.x = currentDimensions.x - (number.width + 10)
	})


	return {
		unsubscribe,
		number
	}
}

const createScale = () => {
	const number = Text.create(1)

	number.y = 74

	let currentDimensions = null
	RenderView.updateWhenResized(({ dimensions }) => {
		number.x = dimensions.x - (number.width + 10)
		currentDimensions = dimensions
	})


	const unsubscribe = Time.listen.paused(paused => {		
		if (!paused) {		
			return Time.listen.scale(scale => {
				number.text = `Gamespeed: ${Math.round(100*scale) / 100}`
				number.x = currentDimensions.x - (number.width + 10)
			})
		} else {
			number.text = 'Game paused'
			number.x = currentDimensions.x - (number.width + 10)
		}
	})


	return {
		unsubscribe,
		number
	}
}

const createHelp = () => {
	const text = Text.create('Help')

	text.y = 116
	const unsubscribe = RenderView.updateWhenResized(({ dimensions }) => {
		text.x = dimensions.x - (text.width + 10)
	})

	Click.on(text, Help.open)
	text.buttonMode = true

	return {
		unsubscribe,
		text
	}
}

const initialize = permanent => {
	const treasure = createTreasure()
	const year = createYear()
	const scale = createScale()
	const help = createHelp()
	permanent.addChild(treasure.number)
	permanent.addChild(year.number)
	permanent.addChild(scale.number)
	permanent.addChild(help.text)
}

export default {
	initialize
}