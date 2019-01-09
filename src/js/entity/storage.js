import Goods from '../data/goods.json'
import Binding from '../util/binding'

const LISTENER_KEY = Binding.listenerKey('storage')
const update = (entity, good, amount) => {
	entity.storage[good] += amount
	Binding.update(entity, 'storage')
}


const listen = (entity, fn) => Binding.listen(entity, 'storage', fn)
const create = entity => Goods.types.reduce((obj, name) => ({ ...obj, [name]: 0 }), {})

export default {
	create,
	listen,
	update,
	LISTENER_KEY
}