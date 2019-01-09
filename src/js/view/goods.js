import Goods from '../data/goods.json'
import Ressources from '../render/ressources'
import Util from '../util/util'


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

export default { create }