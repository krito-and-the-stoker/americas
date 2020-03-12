import * as PIXI from 'pixi.js'

import Goods from 'data/goods.json'
import Resources from 'render/resources'
import Text from 'render/text'


const create = ({ good, amount }) => {
	const sprite = Resources.sprite('map', { frame: Goods[good].id })
	sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)

	let currentAmount = amount
	const number = Text.create(Math.floor(amount))

	const update = (amount, style = {}) => {
		if (amount !== currentAmount || style) {
			currentAmount = amount
			number.text = `${Math.floor(Math.max(0, amount))}`
			Object.assign(number.style, style)
		}
		sprite.tint = Math.floor(amount) ? 0xffffff : 0x999999
	}

	return {
		sprite,
		number,
		update,
		good
	}
}

export default { create }