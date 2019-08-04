import Util from 'util/util'


const listenerKey = key => key ? `${key}ListListeners` : 'listListeners'

const add = (entity, key, member) => {
	const list = entity[key]
	const listeners = listenerKey(key)

	list.push(member)

	if (entity[listeners]) {
		entity[listeners].forEach(listener => {
			const cleanup = {
				fn: listener.fn(member, true),
				member
			}
			listener.cleanup.push(cleanup)
		})
	}

	return () => remove(entity, key, member)
}

const remove = (entity, key, member) => {
	const list = entity[key]
	const listeners = listenerKey(key)

	entity[key] = list.filter(entry => entry !== member)

	if (entity[listeners]) {
		entity[listeners].forEach(listener => {
			Util.execute(listener.cleanup.filter(cleanup => cleanup.member === member).map(cleanup => cleanup.fn))
		})
	}

}

const has = (entity, key, member) => entity[key].includes(member)

const init = (entity, key) => {
	const listeners = listenerKey(key)
	entity[listeners] = []
}

const listen = (entity, key, fn) => {
	const listeners = listenerKey(key)
	if (!entity[listeners]) {
		init(entity, key)
	}

	const listener = {
		fn,
		cleanup: []
	}
	entity[listeners].push(listener)

	entity[key].forEach(member => {	
		const cleanup = {
			fn: listener.fn(member, false),
			member
		}
		listener.cleanup.push(cleanup)
	})


	return () => {
		entity[listeners] = entity[listeners].filter(l => l !== listener)
		Util.execute(listener.cleanup.map(cleanup => cleanup.fn))
	}
}



export default {
	add,
	remove,
	listen,
	has
}