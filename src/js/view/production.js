import Goods from '../data/goods.json'

import Util from '../util/util'
import Ressources from '../render/ressources'


const	create = (amount, resource, width = 100) => {
	if (amount > 0) {
		const index = Goods[resource].id
		const texture = new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(index))
		return Util.range(amount).map(i => {
			const sprite = new PIXI.Sprite(texture)
			sprite.x = Math.round(i*width / amount)
			sprite.y = 0
			return sprite
		})
	} else {
		return []
	}
}

export default { create }