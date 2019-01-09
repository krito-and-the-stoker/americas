
const doNothing = () => {}

const create = (instance, key) => {
	const listeners = listenerKey(key)
	instance[listeners] = []
}

const listen = (instance, key, fn) => {
	const listeners = listenerKey(key)
	const value = key ? instance[key] : undefined
	const cleanup = fn(value) || doNothing
	const listener = {
		fn,
		cleanup
	}

	if (!instance[listeners]) {
		create(instance, key)
	}

	instance[listeners].push(listener)
	
	const remove = () => {
		if (listener.cleanup) {
			listener.cleanup()
		}
		instance[listeners] = instance[listeners].filter(l => l !== listener)
	}
	return remove
}

const update = (instance, key, value) => {
	const listeners = listenerKey(key)
	if (value !== undefined) {
		instance[key] = value
	}
	if (instance[listeners]) {	
		instance[listeners].forEach(listener => {
			if (listener.cleanup) {
				listener.cleanup()
			}
			listener.cleanup = listener.fn(instance[key])
		})
	}
}

const listenerKey = key => key ? `${key}Listeners` : 'listeners'


export default {
	update,
	listen,
	listenerKey
}