import Util from 'util/util'

const create = (instance, key) => {
	const listeners = listenerKey(key)
	instance[listeners] = []
}

const remove = (instance, key, listener) => {
	listener.alive = false
	const listeners = listenerKey(key)
	if (listener.cleanup) {
		Util.execute(listener.cleanup, true)
	}
	instance[listeners] = instance[listeners].filter(l => l !== listener)
}


const listen = (instance, key, fn) => {
	const listeners = listenerKey(key)
	const value = key ? instance[key] : instance
	const cleanup = fn(value)
	const listener = {
		fn,
		cleanup,
		instance,
		key,
		alive: true,
	}

	if (!instance[listeners]) {
		create(instance, key)
	}

	instance[listeners].push(listener)
	return () => remove(instance, key, listener)
}


const pages = [
	new Set(),
	new Set
]

const add = listener => {
	pages[0].add(listener)
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
			.forEach(listener => {
				add(listener)
			})
	}
}

const applyUpdate = () => {
	const scheduled = pages[0]
	pages.reverse()

	scheduled.forEach(listener => {
		if (listener.alive) {
			Util.execute(listener.cleanup, false)
			listener.cleanup = undefined

			const value = listener.key ? listener.instance[listener.key] : listener.instance
			listener.cleanup = listener.fn(value)
		}
	})
	scheduled.clear()
}

const applyAllUpdates = () => {
	while(pages[0].size > 0) {
		applyUpdate()
	}
}

const hasListener = (instance, key) => {
	const listeners = listenerKey(key)
	return (instance[listeners] && instance[listeners].length > 0)	
}

const listenerKey = key => key ? `${key}Listeners` : 'listeners'

const map = (mapping, fn, equals = (a, b) => a === b) => {
	let oldValue = null
	let oldCleanup = null
	const cleanup = final => {
		if (final) {
			Util.execute(oldCleanup, true)
		}
	}
	const optimizedListener = newValue => {
		const mapped = mapping(newValue)
		if (!equals(mapped, oldValue)) {
			oldValue = mapped
			Util.execute(oldCleanup)
			oldCleanup = fn(mapped)
		}

		return cleanup
	}

	return optimizedListener
}

export default {
	update,
	listen,
	hasListener,
	listenerKey,
	map,
	applyUpdate,
	applyAllUpdates,
}