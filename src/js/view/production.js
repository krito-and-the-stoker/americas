import * as PIXI from 'pixi.js'

import Goods from '../data/goods.json'

import Util from '../util/util'
import Resources from '../render/resources'

const MIN_DISTANCE = 4
const MAX_DISTANCE = 30

const	create = (resource, amount, width = 100) => {
	if (amount !== 0) {
		let absoluteAmount = Math.abs(amount)
		let numberOfSprites = absoluteAmount
		let distance = Math.min(MAX_DISTANCE, width / absoluteAmount)
		if (distance < MIN_DISTANCE) {
			distance = MIN_DISTANCE
			numberOfSprites = Math.round(width / distance)
		}
		const result = Util.range(Math.floor(numberOfSprites)).map(i => {
			const sprite = Resources.sprite('map', { frame: Goods[resource].id })
			sprite.x = distance * numberOfSprites - Math.round((i + 1)*distance)
			sprite.y = 0
			if (amount < 0) {
				sprite.tint = 0xFF6666
			}
			return sprite
		})
		if (result.length >= 6) {
			const number = new PIXI.Text(`${absoluteAmount}`, {
				fontFamily: 'Times New Roman',
				fontSize: 32,
				fill: amount > 0 ? 0xffffff : 0xFF6666,
				align: 'center'
			})
			number.x = width / 2
			number.y = 10
			result.push(number)
		}
		return result
	} else {
		return []
	}
}

export default { create }