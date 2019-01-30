import * as PIXI from 'pixi.js'

import Time from 'timeline/time'

import Util from 'util/util'

import Treasure from 'entity/treasure'

import Click from 'input/click'

import RenderView from 'render/view'
import Foreground from 'render/foreground'
import Text from 'render/text'

import Help from 'view/help'
import Europe from 'view/europe'


const createTreasure = () => {
	const container = Text.create(Treasure.amount())

	let currentDimensions = null
	RenderView.listen.dimensions(dimensions => {
		container.x = dimensions.x - (container.width + 10)
		currentDimensions = dimensions
	})
	const unsubscribe = Treasure.bind(amount => {
		container.text = `Treasure: ${amount}`
		container.x = currentDimensions.x - (container.width + 10)
	})


	return {
		unsubscribe,
		container
	}
}


const createYear = () => {
	const container = Text.create(1492)

	let currentDimensions = null
	RenderView.listen.dimensions(dimensions => {
		container.x = dimensions.x - (container.width + 10)
		currentDimensions = dimensions
	})

	const unsubscribe = Time.listen.year(year => {
		container.text = `${year} A.D.`
		container.x = currentDimensions.x - (container.width + 10)
	})


	return {
		unsubscribe,
		container
	}
}

const createEurope = () => {
	const container = Text.create('London')
	container.buttonMode = true

	let currentDimensions = null
	const unsubscribe = Util.mergeFunctions([
		RenderView.listen.dimensions(dimensions => {
			container.x = dimensions.x - (container.width + 10)
			currentDimensions = dimensions
		}),

		Foreground.listen.screen(screen => {
			if (screen && screen.params.name === 'europe') {
				container.text = 'Americas'
				container.x = currentDimensions.x - (container.width + 10)
				return Click.on(container, () => {
					Europe.close()
				})
			} else {
				container.text = 'London'
				container.x = currentDimensions.x - (container.width + 10)
				return Click.on(container, () => {
					Europe.open()
				})
			}
		})
	])

	return {
		unsubscribe,
		container
	}	
}

const createScale = () => {
	const container = Text.create('Gamespeed: 1')
	container.buttonMode = true
	Click.on(container, () => {
		Time.togglePause()
	})

	let currentDimensions = null
	const unsubscribe = Util.mergeFunctions([
		RenderView.listen.dimensions(dimensions => {
			container.x = dimensions.x - (container.width + 10)
			currentDimensions = dimensions
		}),

		Time.listen.paused(paused => {		
			if (!paused) {		
				return Time.listen.scale(scale => {
					container.text = `Gamespeed: ${Math.round(100*scale) / 100}`
					container.x = currentDimensions.x - (container.width + 10)
				})
			} else {
				container.text = 'Game paused'
				container.x = currentDimensions.x - (container.width + 10)
			}
		})
	])


	return {
		unsubscribe,
		container
	}
}

const createHelp = () => {
	const container = Text.create('Help')

	const unsubscribe = RenderView.listen.dimensions(dimensions => {
		container.x = dimensions.x - (container.width + 10)
	})

	Click.on(container, Help.open)
	container.buttonMode = true

	return {
		unsubscribe,
		container
	}
}

const initialize = permanent => {
	const treasure = createTreasure()
	const europe = createEurope()
	const year = createYear()
	const scale = createScale()
	const help = createHelp()
	const offset = 10
	const lineHeight = 32
	year.container.y = offset
	treasure.container.y = offset + lineHeight
	europe.container.y = offset + 2*lineHeight
	scale.container.y = offset + 3*lineHeight
	help.container.y = offset + 4*lineHeight
	permanent.addChild(treasure.container)
	permanent.addChild(year.container)
	permanent.addChild(europe.container)
	permanent.addChild(scale.container)
	permanent.addChild(help.container)
}

export default {
	initialize
}