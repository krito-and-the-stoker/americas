import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'

const create = colony => {
	const container = new PIXI.Container()

	const tories = Colony.tories(colony)
	const rebels  = Colony.rebels(colony)
	const color = tories.number > 5 ? 0xFF8888 : rebels.percentage >= 100 ? 0x88FFFF : rebels.percentage >= 50 ? 0x88FF88 : 0xFFFFFF

	const rebelText = new PIXI.Text(`Rebels: ${rebels.percentage}% (${rebels.number})`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: color,
		align: 'center'
	})

	const toriesText = new PIXI.Text(`Tories: ${tories.percentage}% (${tories.number})`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: color,
		align: 'center'
	})

	rebelText.x = 10
	toriesText.x = 610 - toriesText.width

	container.y = 710
	container.addChild(rebelText)
	container.addChild(toriesText)

	const updateRebelsAndTories = () => {
		const rebels  = Colony.rebels(colony)
		const tories = Colony.tories(colony)
		const color = tories.number > 5 ? 0xFF8888 : rebels.percentage >= 100 ? 0x88FFFF : rebels.percentage >= 50 ? 0x88FF88 : 0xFFFFFF
		const style = {
			fontFamily: 'Times New Roman',
			fontSize: 32,
			fill: color,
			align: 'center'
		}

		rebelText.text = `Rebels: ${rebels.percentage}% (${rebels.number})`
		toriesText.text = `Tories: ${tories.percentage}% (${tories.number})`
		rebelText.style = style
		toriesText.style = style
	}

	const unsubscribeBells = Colony.listen.bells(colony, updateRebelsAndTories)
	const unsubscribeColonists = Colony.listen.colonists(colony, updateRebelsAndTories)

	const unsubscribe = () => {
		unsubscribeColonists()
		unsubscribeBells()
	}

	return {
		unsubscribe,
		container
	}
}

export default { create }