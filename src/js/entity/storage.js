import Goods from '../data/goods.json'
import Binding from '../util/binding'
import Util from '../util/util'


const update = (storage, pack) => {
	if (pack && pack.amount) {
		storage[pack.good] += pack.amount
	}
	Binding.update(storage)
}


const listen = (storage, fn) => Binding.listen(storage, null, fn)
const create = () => Goods.types.reduce((obj, name) => ({ ...obj, [name]: 0 }), {})
const createWithProduction = () => Goods.types.concat(Goods.productions).reduce((obj, name) => ({ ...obj, [name]: 0 }), {})

const split = storage => goods(storage)
	.filter(({ amount }) => amount > 0)
	.map(({ good, amount }) => 
		Util.range(Math.ceil(amount / 100))
			.map(i => Math.min(100*(i+1), amount - 100*i))
			.map(amount => ({ good, amount }))
		).flat()

const transfer = (src, dest, pack = {}, supressUpdate = false) => {
	const move = ({ good, amount }) => {
		if (amount) {
			dest[good] += amount
			src[good] -= amount
		}  else {
			dest[good] += src[good]
			src[good] = 0
		}
	}

	if (pack.good) {
		move(pack)
	} else {
		goods(src)
			.forEach(move)
	}

	if (!supressUpdate) {
		update(src)
		update(dest)
	}
}

const transferWithProduction = (src, dest) => {
	transfer(src, dest, {}, true)
	productions(src).forEach(pack => transfer(src, dest, pack, true))
	update(src)
	update(dest)
}

const goods = storage => Object.values(Goods.types).map(good => ({ good, amount: storage[good] }))
const productions = storage => Object.values(Goods.productions).map(good => ({ good, amount: storage[good] }))

const save = storage => Object.values(Goods.types).map(good => [good, storage[good]])
const load = data => Util.makeObject(data)

export default {
	create,
	createWithProduction,
	listen,
	update,
	split,
	transfer,
	transferWithProduction,
	load,
	save,
	goods,
	productions,
}