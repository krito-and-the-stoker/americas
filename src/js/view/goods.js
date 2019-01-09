import Goods from '../data/goods.json'
import Ressources from '../render/ressources'
import Util from '../util/util'


const splitStorage = storage => {
	return Object.keys(storage)
		.filter(good => storage[good] > 0)
		.map(good => 
			Util.range(Math.ceil(storage[good] / 100))
				.map(i => Math.min(100*(i+1), storage[good] - 100*i))
				.map(amount => ({ good, amount }))
			).flat()
}

const create = ({ good, amount }) => {
	const frame = Goods[good].id
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))

	const number = new PIXI.Text(`${amount}`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})

	const update = amount => number.text = `${Math.floor(amount)}`

	return {
		sprite,
		number,
		update,
		good
	}
}

export default {
	create,
	splitStorage
}