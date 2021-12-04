import * as PIXI from 'pixi.js'

import Colony from 'entity/colony'
import Binding from 'util/binding'
import Text from 'render/text'

const create = colony => {
	const container = new PIXI.Container()

	const tories = Colony.tories(colony)
	const rebels  = Colony.rebels(colony)
	const color = tories.number > 9 ? 0xFF8888 : rebels.percentage >= 100 ? 0x88FFFF : rebels.percentage >= 50 ? 0x88FF88 : 0xFFFFFF

	const rebelText = Text.create(`integrated: ${rebels.percentage}% (${rebels.number})`, {
		fill: color,
		fontSize: 24
	})

	const toriesText = Text.create(`unorganized: ${tories.percentage}% (${tories.number})`, {
		fill: color,
		fontSize: 24
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

		rebelText.text = `integrated: ${rebels.percentage}% (${rebels.number})`
		toriesText.text = `unorganized: ${tories.percentage}% (${tories.number})`
		rebelText.style.fill = color
		toriesText.style.fill = color
	}

	const unsubscribe = [
		Colony.listen.productionBonus(colony, updateRebelsAndTories),
		Colony.listen.bells(colony, Binding.map(freedomPercentage, updateRebelsAndTories)),
		Colony.listen.colonists(colony, Binding.map(freedomPercentage, updateRebelsAndTories)),
		Colony.listen.colonists(colony, Binding.map(colonySize, updateRebelsAndTories)),
	]

	return {
		unsubscribe,
		container
	}
}

export default { create }