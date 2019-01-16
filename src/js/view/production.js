import * as PIXI from 'pixi.js'

import Goods from '../data/goods.json'

import Util from '../util/util'
import Ressources from '../render/ressources'

const MAX_DISTANCE = 30

const	create = (resource, amount, width = 100) => {
	if (amount !== 0) {
		let absoluteAmount = Math.abs(amount)
		const frame = Goods[resource].id
		const texture = new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame))
		let distance = Math.min(MAX_DISTANCE, width / absoluteAmount)
		if (distance < 1) {
			distance = 1
			absoluteAmount = Math.round(distance * absoluteAmount)
		}
		const result = Util.range(Math.floor(absoluteAmount)).map(i => {
			const sprite = new PIXI.Sprite(texture)
			sprite.x = distance * absoluteAmount - Math.round((i + 1)*distance)
			sprite.y = 0
			if (amount < 0) {
				sprite.tint = 0xFF6666
			}
			return sprite
		})
		if (result.length > 6) {
			const number = new PIXI.Text(`${absoluteAmount}`, {
				fontFamily: 'Times New Roman',
				fontSize: 32,
				fill: amount > 0 ? 0xffffff : 0xFF6666,
				align: 'center'
			})
			number.x = 10
			number.y = 10
			result.push(number)
		}
		return result
	} else {
		return []
	}
}

export default { create }