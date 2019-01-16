import * as PIXI from 'pixi.js'
import RenderView from '../render/view'
import Time from '../timeline/time'

const createYear = () => {
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

const createScale = () => {
	const number = new PIXI.Text(`${1}`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})

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
const initialize = permanent => {
	const year = createYear()
	const scale = createScale()
	permanent.addChild(year.number)
	permanent.addChild(scale.number)
}

export default {
	initialize
}