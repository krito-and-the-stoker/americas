
const doNothing = () => {}

const create = (instance, key) => {
	const listeners = listenerKey(key)
	instance[listeners] = []
}

const listen = (instance, key, fn) => {
	const listeners = listenerKey(key)
	const value = key ? instance[key] : instance
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
		if (instance[key] === value) {
			return
		}
		instance[key] = value
	}
	if (instance[listeners]) {	
		instance[listeners].forEach(listener => {
			if (listener.cleanup) {
				listener.cleanup()
			}
			const value = key ? instance[key] : instance
			listener.cleanup = listener.fn(value)
		})
	}
}

const listenerKey = key => key ? `${key}Listeners` : 'listeners'

const shared = fn => {
	let destroyScheduled = 0
	let destroyExecuted = 0
	let destroy = null
	return arg => {
		if (destroy) {
			destroy()
			destroyExecuted += 1
		}
		destroy = fn(arg) || doNothing
		return () => {
			destroyScheduled += 1
			if (destroyScheduled > destroyExecuted) {
				destroy()
				destroyExecuted += 1
			}
		}
	}
}

export default {
	update,
	listen,
	listenerKey,
	shared
}