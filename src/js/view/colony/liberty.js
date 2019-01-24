import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import Binding from '../../util/binding'
import Text from 'src/render/text'

const create = colony => {
	const container = new PIXI.Container()

	const tories = Colony.tories(colony)
	const rebels  = Colony.rebels(colony)
	const color = tories.number > 9 ? 0xFF8888 : rebels.percentage >= 100 ? 0x88FFFF : rebels.percentage >= 50 ? 0x88FF88 : 0xFFFFFF

	const rebelText = Text.create(`Rebels: ${rebels.percentage}% (${rebels.number})`, {
		fill: color,
	})

	const toriesText = Text.create(`Tories: ${tories.percentage}% (${tories.number})`, {
		fill: color,
	})

	rebelText.x = 10
	toriesText.x = 610 - toriesText.width

	container.y = 710
	container.addChild(rebelText)
	container.addChild(toriesText)

	const freedomPercentage = () => Colony.tories(colony).percentage
	const colonySize = () => colony.colonists.length
	const updateRebelsAndTories = () => {
		const rebels  = Colony.rebels(colony)
		const tories = Colony.tories(colony)
		const color = tories.number > 9 ? 0xFF8888 : rebels.percentage >= 100 ? 0x88FFFF : rebels.percentage >= 50 ? 0x88FF88 : 0xFFFFFF
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

	const unsubscribeBells = Colony.listen.bells(colony, Binding.map(updateRebelsAndTories, freedomPercentage))
	const unsubscribeColonistsPercentage = Colony.listen.colonists(colony, Binding.map(updateRebelsAndTories, freedomPercentage))
	const unsubscribeColonistsAmount = Colony.listen.colonists(colony, Binding.map(updateRebelsAndTories, colonySize))

	const unsubscribe = () => {
		unsubscribeColonistsPercentage()
		unsubscribeColonistsAmount()
		unsubscribeBells()
	}

	return {
		unsubscribe,
		container
	}
}

export default { create }