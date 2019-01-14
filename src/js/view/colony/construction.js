import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'
import Building from '../../entity/building'
import Dialog from '../../view/ui/dialog'
import Button from '../../view/ui/button'
import Util from '../../util/util'
import ProductionView from '../../view/production'


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

	const buildingText = new PIXI.Text(`${colony.construction.name}`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})
	buildingText.x =  originalDimensions.x - 450 + 20
	buildingText.y = originalDimensions.y / 2 - 75
	container.panel.addChild(buildingText)

	Colony.listen.construction(colony, construction => {
		const percentage = Math.min(100, Math.floor(100 * construction.amount / construction.cost.construction))
		buildingText.text = `${construction.name} (${percentage}%)`
		// const rows = 3
		// const goodsPerRow = Math.ceil(construction.cost.construction / rows)
		// const goodsLastRow = construction.cost.construction - goodsPerRow * (rows - 1)
		// const sprites = Util.range(rows).map(row => {
		// 	const amount = Math.min(Math.floor(Math.max(0, construction.amount - row * goodsPerRow)), goodsPerRow)
		// 	const view = ProductionView.create('construction', amount, 390)
		// 	view.forEach(s => {
		// 		s.y = originalDimensions.y / 2 - 35 + row * 30
		// 		s.x += originalDimensions.x - 450 + 10
		// 		container.addChild(s)
		// 	})
		// 	return view
		// }).flat()
		// return () => {
		// 	sprites.forEach(s => container.removeChild(s))
		// }
	})

	return {
		container
	}
}

export default { create }