import * as PIXI from 'pixi.js'
import RenderView from '../render/view'
import Time from '../timeline/time'

const create = () => {
	const number = new PIXI.Text(`${1492}`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})

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

const initialize = permanent => {
	const { number } = create()
	permanent.addChild(number)
}

export default {
	create,
	initialize
}