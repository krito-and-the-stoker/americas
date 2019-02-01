import Binding from './binding'


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
	cleanupOne(key, member)
}

const has = (entity, key, member) => entity[key].includes(member)



const listenerKey = key => `${key}ListenerEach`
const cleanupKey = key => `${key}CleanupEach`

const init = (entity, key) => {
	entity[listenerKey(key)] = []
}

const initOne = (key, member) => {
	member[cleanupKey(key)] = []
}
const cleanupOne = (key, member) => {
	if (member[cleanupKey(key)]) {
		member[cleanupKey(key)].forEach(fn => fn ? fn() : null)	
		member[cleanupKey(key)] = []
	}
}

const updateOne = (entity, key, member) => {
	if (entity[listenerKey(key)]) {
		cleanupOne(key, member)
		member[cleanupKey(key)] = entity[listenerKey(key)].map(fn => fn(member, true))
	}
}

const unsubscribe = (entity, key, fn) => {
	const index = entity[listenerKey(key)].indexOf(fn)
	entity[listenerKey(key)] = entity[listenerKey(key)].filter(f => f !== fn)

	entity[key].forEach(member => {
		if (member[cleanupKey(key)][index]) {
			member[cleanupKey(key)][index]()
		}
		member[cleanupKey(key)] = member[cleanupKey(key)].filter((cleanup, i) => i !== index)
	})
}

const listenEach = (entity, key, fn) => {
	if (!entity[listenerKey(key)]) {
		init(entity, key)
	}
	entity[listenerKey(key)].push(fn)

	entity[key].forEach(member => {
		if (!member[cleanupKey(key)]) {
			initOne(key, member)
		}
		member[cleanupKey(key)].push(fn(member, false))
	})

	return () => unsubscribe(entity, key, fn)
}



export default {
	add,
	remove,
	listenEach,
	has
}