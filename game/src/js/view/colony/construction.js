import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Binding from 'util/binding'

import Colony from 'entity/colony'
import Building from 'entity/building'
import Storage from 'entity/storage'
import Construction from 'entity/construction'

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
		const cost = Object.entries(option.cost()).map(([good, amount]) => `${amount}<good>${good}</good>`).join(' ')
		return `<|**${option.name()}**<-> ${cost} (${Math.floor(100 * option.progress() / Util.sum(Object.values(option.cost())))}%)|>`
	}

	const constructionButton = Button.create('change', () => {
		const options = Construction.options(colony)
		const choices = options.map(option => ({
			text: optionDescription(option),
			action: () => {
				Construction.start(colony, option)
			}
		})).concat([{
			text: '**Stop construction**',
			action: () => {
				Construction.start(colony, null)
			}
		}])

		return Dialog.create({
			type: 'menu',
			text: 'What would you like to *construct*? <options/>',
			options: choices,
		})
	})
	constructionButton.x = originalDimensions.x - constructionButton.width - 20
	constructionButton.y = 650
	container.panel.addChild(constructionButton)

	const buildingText = Text.create(Colony.currentConstruction(colony).name)
	buildingText.x =  originalDimensions.x - 450 + 20
	buildingText.y = originalDimensions.y / 2 - 75
	container.panel.addChild(buildingText)

	const updateConstructionPanel = () => {
		const construction = Colony.currentConstruction(colony)
		const totalCost = Util.sum(Object.values(construction.cost))
		const percentage = totalCost > 0
			? Math.min(100, Math.floor(100 * construction.progress / totalCost))
			: 0
		buildingText.text = `${construction.name} (${percentage}%)`
	}		


	const unsubscribe = [
		Colony.listen.construction(colony, Binding.map(construction =>
			Math.round(Colony.currentConstruction(colony).progress), updateConstructionPanel)),
		Colony.listen.constructionTarget(colony, updateConstructionPanel)
	]

	return {
		container,
		unsubscribe
	}
}

export default { create }