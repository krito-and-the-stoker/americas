import * as PIXI from 'pixi.js'

import Colony from 'entity/colony'
import Building from 'entity/building'
import Dialog from 'view/ui/dialog'
import Button from 'view/ui/button'
import Util from 'util/util'
import ProductionView from 'view/production'
import Binding from 'util/binding'
import Storage from 'entity/storage'
import Text from 'render/text'


const create = (colony, originalDimensions) => {
	const container = {
		panel: new PIXI.Container(),
		menu: new PIXI.Container()
	}

	const constructionButton = Button.create('change', () => {
		const options = Building.constructionOptions(colony)
		const choices = options.map(option => `${option.name} (${option.cost.construction})`)
		return Dialog.createIndependent('What would you like to construct?',
			choices,
			null,
			{
				context: container.menu,
				pause: false
			})
		.then(decision => {
			Colony.update.construction(colony, {
				amount: colony.construction.amount,
				...options[decision]
			})
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
	const updateConstructionPanel = amount => {
		const construction = colony.construction
		const percentage = Math.min(100, Math.floor(100 * construction.amount / construction.cost.construction))
		buildingText.text = `${construction.name} (${percentage}%)`
		const rows = 3
		const goodsPerRow = Math.ceil(construction.cost.construction / rows)
		const goodsLastRow = construction.cost.construction - goodsPerRow * (rows - 1)
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

	const getTools = storage => Math.floor(storage.tools)
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
		Storage.listen(colony.storage, Binding.map(have =>
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