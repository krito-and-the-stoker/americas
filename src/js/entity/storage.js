import Goods from '../data/goods.json'
import Binding from '../util/binding'
import Util from '../util/util'

const LISTENER_KEY = Binding.listenerKey('storage')
const update = (entity, good, amount) => {
	entity.storage[good] += amount
	Binding.update(entity, 'storage')
}


const listen = (entity, fn) => Binding.listen(entity, 'storage', fn)
const create = entity => Goods.types.reduce((obj, name) => ({ ...obj, [name]: 0 }), {})

const split = storage => Object.keys(storage)
	.filter(good => storage[good] > 0)
	.map(good => 
		Util.range(Math.ceil(storage[good] / 100))
			.map(i => Math.min(100*(i+1), storage[good] - 100*i))
			.map(amount => ({ good, amount }))
		).flat()


export default {
	create,
	listen,
	update,
	split,
	LISTENER_KEY
}