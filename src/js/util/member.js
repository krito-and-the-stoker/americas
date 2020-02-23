import Util from 'util/util'
import Binding from './binding'


const uniqueId = entity => {
	if (!entity[uniqueIdKey()]) {
		entity[uniqueIdKey()] = Util.uid()
	}

	return entity[uniqueIdKey()]
}

const update = (entity, key, members) => Binding.update(entity, key, members)

const	add = (entity, key, member) => {
	if (!entity[key].includes(member)) {
		entity[key].push(member)
		update(entity, key)
		updateOne(entity, key, member)
	}

	return () => remove(entity, key, member)
}

const	remove = (entity, key, member) => {
	update(entity, key, entity[key].filter(u => u !== member))
	cleanupOne(entity, key, member)
}

const has = (entity, key, member) => entity[key].includes(member)



const listenerKey = key => `${key}ListenerEach`
const cleanupKey = (entity, key) => `${uniqueId(entity)}${key}CleanupEach`
const uniqueIdKey = () => 'uniqueIdListenEach'

const init = (entity, key) => {
	entity[listenerKey(key)] = []
}

const initOne = (entity, key, member) => {
	member[cleanupKey(entity, key)] = []
}
const cleanupOne = (entity, key, member) => {
	if (member[cleanupKey(entity, key)]) {
		member[cleanupKey(entity, key)].forEach(fn => Util.execute(fn))
		member[cleanupKey(entity, key)] = []
	}
}

const updateOne = (entity, key, member) => {
	if (entity[listenerKey(key)]) {
		cleanupOne(entity, key, member)
		member[cleanupKey(entity, key)] = entity[listenerKey(key)].map(fn => fn(member, true))
	}
}

const unsubscribe = (entity, key, fn) => {
	const index = entity[listenerKey(key)].indexOf(fn)
	entity[listenerKey(key)] = entity[listenerKey(key)].filter(f => f !== fn)

	entity[key].forEach(member => {
		if (member[cleanupKey(entity, key)][index]) {
			member[cleanupKey(entity, key)][index]()
		}
		member[cleanupKey(entity, key)] = member[cleanupKey(entity, key)].filter((cleanup, i) => i !== index)
	})
}

const listenEach = (entity, key, fn) => {
	if (!entity[listenerKey(key)]) {
		init(entity, key)
	}
	entity[listenerKey(key)].push(fn)

	entity[key].forEach(member => {
		if (!member[cleanupKey(entity, key)]) {
			initOne(entity, key, member)
		}
		member[cleanupKey(entity, key)].push(fn(member, false))
	})

	return () => unsubscribe(entity, key, fn)
}



export default {
	add,
	remove,
	listenEach,
	has
}