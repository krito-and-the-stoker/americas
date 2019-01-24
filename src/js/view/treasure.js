import * as PIXI from 'pixi.js'
import Treasure from 'entity/treasure'
import RenderView from 'render/view'
import Text from 'render/text'

const create = () => {
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

const initialize = permanent => {
	const { number } = create()
	permanent.addChild(number)
}

export default {
	create,
	initialize
}