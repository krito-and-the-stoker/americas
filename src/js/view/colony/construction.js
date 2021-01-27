import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Binding from 'util/binding'

import Colony from 'entity/colony'
import Building from 'entity/building'
import Storage from 'entity/storage'

import Dialog from 'view/ui/dialog'
import Button from 'view/ui/button'
import ProductionView from 'view/production'
import Text from 'render/text'


const create = (colony, originalDimensions) => {
	const container = {
		panel: new PIXI.Container(),
		menu: new PIXI.Container()
	}

	const optionDescription = option => {
		const constructionCost = option.cost()
		const cost = constructionCost.tools ? `${constructionCost.construction} / ${constructionCost.tools}` : `${constructionCost.construction}`
		return `${option.name()} (${cost})`
	}

	const constructionButton = Button.create('change', () => {
		const options = Building.constructionOptions(colony)
		const choices = options.map(option => ({
			text: optionDescription(option),
			action: () => {
				Colony.update.constructionTarget(option.target)
			}
		}))

		return Dialog.create({
			type: 'menu',
			text: 'What would you like to construct?',
			options: choices,
		})
	})
	constructionButton.x = originalDimensions.x - constructionButton.width - 20
	constructionButton.y = 650
	container.panel.addChild(constructionButton)

	const buildingText = Text.create(colony.construction[colony.constructionTarget].name)
	buildingText.x =  originalDimensions.x - 450 + 20
	buildingText.y = originalDimensions.y / 2 - 75
	container.panel.addChild(buildingText)

	const updateConstructionPanel = () => {
		const construction = Colony.construction(colony)
		const totalCost = Util.sum(Object.values(construction.cost))
		const percentage = totalCost > 0
			? Math.min(100, Math.floor(100 * construction.progress / totalCost))
			: 0
		buildingText.text = `${construction.name} (${percentage}%)`
		// const rows = 3
		// const goodsPerRow = Math.ceil(construction.cost.construction / rows)
		// const sprites = Util.range(rows).map(row => {
		// 	const amount = Math.min(Math.floor(Math.max(0, construction.amount - row * goodsPerRow)), goodsPerRow)
		// 	const view = ProductionView.create('construction', amount, 390)
		// 	view.forEach(s => {
		// 		s.y = originalDimensions.y / 2 - 35 + row * 30
		// 		s.x += originalDimensions.x - 450 + 10
		// 		container.panel.addChild(s)
		// 	})
		// 	return view
		// }).flat()
		// return () => {
		// 	sprites.forEach(s => container.panel.removeChild(s))
		// }
	}		


	return [
		Colony.listen.construction(colony, Binding.map(construction =>
			Math.round(construction[colony.constructionTarget].progress), updateConstructionPanel)),
		Colony.listen.constructionTarget(colony, updateConstructionPanel)
	]

	// const getToolsUsed = construction => Math.floor(construction.tools)
	// const getToolsNeeded = construction => Math.floor(construction.cost.tools)
	// const getToolsAvailable = storage => Math.floor(storage.tools)
	// const updateToolsPanel = (used, have, needed) => {
	// 	if (!needed) {
	// 		return
	// 	}

	// 	const fraction = Math.min(used / needed, 1)
	// 	const usedView = ProductionView.create('tools', Math.min(used, needed), fraction * 260)
	// 	usedView.forEach(s => {
	// 		s.y = originalDimensions.y / 2 - 5 + 3 * 30
	// 		s.x += originalDimensions.x - 460
	// 		container.panel.addChild(s)
	// 	})
	// 	const missingView = ProductionView.create('tools', Util.clamp(have + used - needed, -needed, 0), (1 - fraction) * 260)
	// 	missingView.forEach(s => {
	// 		s.y = originalDimensions.y / 2 - 5 + 3 * 30
	// 		s.x += originalDimensions.x - 460 + fraction * 260
	// 		container.panel.addChild(s)
	// 	})

	// 	return () => {
	// 		usedView.forEach(s => container.panel.removeChild(s))
	// 		missingView.forEach(s => container.panel.removeChild(s))
	// 	}
	// }

	// const unsubscribeTools = Colony.listen.construction(colony, Binding.map(getToolsNeeded, needed =>
	// 	Storage.listen(colony.storage, Binding.map(getToolsAvailable, have =>
	// 		Colony.listen.construction(colony, Binding.map(getToolsUsed, used =>
	// 			updateToolsPanel(used, have, needed)))))))


	// const unsubscribe = () => {
	// 	unsubscribeAmount()
	// 	unsubscribeTarget()
	// 	unsubscribeTools()
	// }

	return {
		container,
		unsubscribe
	}
}

export default { create }