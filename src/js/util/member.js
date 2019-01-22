import Binding from './binding'


const update = (entity, key, members) => Binding.update(entity, key, members)

const	add = (entity, key, member) => {
	if (!entity[key].includes(member)) {
		entity[key].push(member)
		update(entity, key)
	}
}

const	remove = (entity, key, member) => {
	update(entity, key, entity[key].filter(u => u !== member))
}

const has = (entity, key, member) => entity[key].includes(member)

const listenerKey = key => `${key}ListenerEach`
const init = (entity, key) => {
	entity[listenerKey(key)] = []
}
const updateOne = member => {
	member.listenerEach.cleanup.forEach(fn => fn())
	member.listenerEach.cleanup = member.listenerEach.listener.map(fn => fn())
}
const listenEach = (entity, key, fn) => {
	const listener = listenerKey(key)
	if (!entity[listener]) {
		init(entity, key)
	}

	entity[key].forEach(member => {

	})
}

export default {
	add,
	remove,
	has
}