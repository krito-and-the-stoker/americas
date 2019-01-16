
const doNothing = () => {}

const create = (instance, key) => {
	const listeners = listenerKey(key)
	instance[listeners] = []
}

const remove = (instance, key, listener) => {	
	const listeners = listenerKey(key)
	if (listener.cleanup) {
		listener.cleanup(true)
	}
	instance[listeners] = instance[listeners].filter(l => l !== listener)
}


const listen = (instance, key, fn) => {
	const listeners = listenerKey(key)
	const value = key ? instance[key] : instance
	const cleanup = fn(value) || doNothing
	const listener = {
		fn,
		cleanup,
		keep: true
	}

	if (!instance[listeners]) {
		create(instance, key)
	}

	instance[listeners].push(listener)
	return () => remove(instance, key, listener)
}

// currently unused
const once = (instance, key, fn) => {
	const listeners = listenerKey(key)
	const listener = {
		fn,
		keep: false
	}

	if (!instance[listeners]) {
		create(instance, key)
	}

	instance[listeners].push(listener)
	return () => remove(instance, key, listener)
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
		instance[listeners]
			.filter(listener => listener.cleanup)
			.forEach(listener => listener.cleanup(false))
		instance[listeners].forEach(listener => {
			const value = key ? instance[key] : instance
			listener.cleanup = listener.fn(value)
		})
		instance[listeners]
			.filter(listener => !listener.keep)
			.forEach(listener => remove(listener))
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


const map = (fn, mapping, equals = (a, b) => a === b) => {
	let oldValue = null
	let oldCleanup = null
	const cleanup = final => {
		if (final && oldCleanup) {
			oldCleanup()
		}
	}
	const optimizedListener = newValue => {
		const mapped = mapping(newValue)
		if (!equals(mapped, oldValue)) {
			oldValue = mapped
			if (oldCleanup) {
				oldCleanup()
			}
			oldCleanup = fn(mapped)
		}

		return cleanup
	}

	return optimizedListener
}

export default {
	update,
	listen,
	listenerKey,
	shared,
	map
}