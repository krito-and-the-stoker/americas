
const doNothing = () => {}

const create = (instance, key) => {
	const listeners = listenerKey(key)
	instance[listeners] = []
}

const listen = (instance, key, fn) => {
	const listeners = listenerKey(key)
	const cleanup = fn(instance[key]) || doNothing
	const listener = {
		fn,
		cleanup
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
	instance[listeners].forEach(listener => {
		console.log('updating', listener)
		if (listener.cleanup) {
			listener.cleanup()
		}
		listener.cleanup = listener.fn(instance[key])
	})
}

const listenerKey = key => `${key}Listeners`


export default {
	create,
	update,
	listen,
	listenerKey
}