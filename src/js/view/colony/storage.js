import * as PIXI from 'pixi.js'

import Colony from '../../entity/colony'

const create = (colony, originalDimensions) => {
	const numberOfGoods = Object.keys(colony.storage).length
	const textObjects = Object.entries(colony.storage).map(([good, amount], i) => {
		const number = new PIXI.Text(`${amount}`, {
			fontFamily: 'Times New Roman',
			fontSize: 32,
			fill: 0xffffff,
			align: 'center'
		})
		number.anchor.set(0.5)
		const width = originalDimensions.x / numberOfGoods
		number.position.x = (i + 0.5) * width
		number.position.y = originalDimensions.y - width / 4

		return number
	})
	const storageTextContainer = new PIXI.Container()
	textObjects.forEach(number => {
		storageTextContainer.addChild(number)
	})
	const unsubscribe = Colony.bindStorage(colony, storage => {
		Object.values(storage).forEach((value, i) => {
			textObjects[i].text = `${Math.floor(value)}`
		})
	})
	
	return {
		container: storageTextContainer,
		unsubscribe
	}
}

export default { create }