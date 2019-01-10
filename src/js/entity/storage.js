import Goods from '../data/goods.json'
import Binding from '../util/binding'
import Util from '../util/util'


const update = (storage, pack) => {
	if (pack.amount) {
		storage[pack.good] += pack.amount
	}
	Binding.update(storage)
}


const listen = (storage, fn) => Binding.listen(storage, null, fn)
const create = () => Goods.types.reduce((obj, name) => ({ ...obj, [name]: 0 }), {})

const split = storage => Object.keys(storage)
	.filter(good => storage[good] > 0)
	.map(good => 
		Util.range(Math.ceil(storage[good] / 100))
			.map(i => Math.min(100*(i+1), storage[good] - 100*i))
			.map(amount => ({ good, amount }))
		).flat()

const transfer = (src, dest, pack = {}) => {
	const move = ({ good, amout }) => {
		dest[good] += amount || src[good]
		src[good] -= amount || src[good]
	}

	if (pack.good) {
		move(pack)
	} else {
		Object.keys(src)
			.map(good => ({ good }))
			.forEach(move)
	}

	update(src)
	update(dest)
}

export default {
	create,
	listen,
	update,
	split,
	transfer
}