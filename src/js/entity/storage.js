import Goods from '../data/goods.json'
import Util from '../util/util'

const LISTENER_KEY = Util.binding('storage').listenerKey
const update = (entity, good, amount) => {
	entity.storage[good] += amount
	Util.binding('storage').update(entity)
}

const init = entity => Util.binding('storage').init(entity)
const listen = (entity, fn) => Util.binding('storage').bind(entity, fn)

const create = entity => {
	init(entity)
	return Goods.types.reduce((obj, name) => ({ ...obj, [name]: 0 }), {})
}

export default {
	create,
	init,
	listen,
	update,
	LISTENER_KEY
}