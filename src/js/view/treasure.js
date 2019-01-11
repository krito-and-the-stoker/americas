import * as PIXI from 'pixi.js'
import Treasure from '../entity/treasure'
import RenderView from '../render/view'

const create = () => {
	const number = new PIXI.Text(`${Treasure.amount()}`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})

	number.y = 10

	let currentDimensions = null
	RenderView.updateWhenResized(({ dimensions }) => {
		number.x = dimensions.x - (number.width + 10)
		currentDimensions = dimensions
	})
	const unsubscribe = Treasure.bind(amount => {
		number.text = `${amount}`
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