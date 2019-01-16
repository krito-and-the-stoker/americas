import Goods from '../data/goods.json'
import Ressources from '../render/ressources'
import Util from '../util/util'


const create = ({ good, amount }) => {
	const frame = Goods[good].id
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
	sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)

	let currentAmount = amount
	const number = new PIXI.Text(`${amount}`, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})

	const update = amount => {
		if (amount !== currentAmount) {
			currentAmount = amount
			number.text = `${Math.floor(Math.max(0, amount))}`
		}
	}

	return {
		sprite,
		number,
		update,
		good
	}
}

export default { create }