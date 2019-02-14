import * as PIXI from 'pixi.js'

import Colony from 'entity/colony'
import Building from 'entity/building'
import Dialog from 'view/ui/dialog'
import Button from 'view/ui/button'
import Util from 'util/util'
import ProductionView from 'view/production'
import Binding from 'util/binding'
import Text from 'render/text'


const create = (colony, originalDimensions) => {
	const container = {
		panel: new PIXI.Container(),
		menu: new PIXI.Container()
	}

	const optionDescription = option => {
		const cost = option.cost.tools ? `${option.cost.construction} / ${option.cost.tools}` : `${option.cost.construction}`
		return `${option.name} (${cost})`
	}

	const constructionButton = Button.create('change', () => {
		const options = Building.constructionOptions(colony)
		const choices = options.map(option => ({
			text: optionDescription(option),
			action: () => {
				if (option.target !== colony.construction.target) {				
					Colony.update.construction(colony, {
						amount: colony.construction.amount / 2 + Math.min(colony.construction.amount / 2, 12),
						tools: colony.construction.tools / 2,
						...option
					})
				}
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

	const buildingText = Text.create(colony.construction.name)
	buildingText.x =  originalDimensions.x - 450 + 20
	buildingText.y = originalDimensions.y / 2 - 75
	container.panel.addChild(buildingText)

	const getAmount = construction => Math.round(construction.amount)
	const getTarget = construction => construction.target
	const updateConstructionPanel = () => {
		const construction = colony.construction
		const percentage = Math.min(100, Math.floor(100 * construction.amount / construction.cost.construction))
		buildingText.text = `${construction.name} (${percentage}%)`
		const rows = 3
		const goodsPerRow = Math.ceil(construction.cost.construction / rows)
		const sprites = Util.range(rows).map(row => {
			const amount = Math.min(Math.floor(Math.max(0, construction.amount - row * goodsPerRow)), goodsPerRow)
			const view = ProductionView.create('construction', amount, 390)
			view.forEach(s => {
				s.y = originalDimensions.y / 2 - 35 + row * 30
				s.x += originalDimensions.x - 450 + 10
				container.panel.addChild(s)
			})
			return view
		}).flat()
		return () => {
			sprites.forEach(s => container.panel.removeChild(s))
		}
	}		


	const unsubscribeAmount = Colony.listen.construction(colony, Binding.map(updateConstructionPanel, getAmount))
	const unsubscribeTarget = Colony.listen.construction(colony, Binding.map(updateConstructionPanel, getTarget))

	const getTools = construction => Math.floor(construction.tools)
	const getToolsNeeded = construction => construction.cost.tools
	const updateToolsPanel = (have, needed) => {
		if (!needed) {
			return
		}

		const fraction = Math.min(have / needed, 1)
		const haveView = ProductionView.create('tools', Math.min(have, needed), fraction * 260)
		haveView.forEach(s => {
			s.y = originalDimensions.y / 2 - 5 + 3 * 30
			s.x += originalDimensions.x - 460
			container.panel.addChild(s)
		})
		const needView = ProductionView.create('tools', Math.min(have - needed, 0), (1- fraction) * 260)
		needView.forEach(s => {
			s.y = originalDimensions.y / 2 - 5 + 3 * 30
			s.x += originalDimensions.x - 460 + fraction * 260
			container.panel.addChild(s)
		})

		return () => {
			haveView.forEach(s => container.panel.removeChild(s))
			needView.forEach(s => container.panel.removeChild(s))
		}
	}

	const unsubscribeTools = Colony.listen.construction(colony, Binding.map(needed =>
		Colony.listen.construction(colony, Binding.map(have =>
			updateToolsPanel(have, needed), getTools)), getToolsNeeded))


	const unsubscribe = () => {
		unsubscribeAmount()
		unsubscribeTarget()
		unsubscribeTools()
	}

	return {
		container,
		unsubscribe
	}
}

export default { create }