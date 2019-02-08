import Util from 'util/util'

const doNothing = () => {}

const create = (instance, key) => {
	const listeners = listenerKey(key)
	instance[listeners] = []
}

const remove = (instance, key, listener) => {	
	const listeners = listenerKey(key)
	if (listener.cleanup) {
		Util.execute(listener.cleanup, true)
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
		instance,
		key,
		keep: true
	}

	if (!instance[listeners]) {
		create(instance, key)
	}

	instance[listeners].push(listener)
	return () => remove(instance, key, listener)
}

// currently unused
// const once = (instance, key, fn) => {
// 	const listeners = listenerKey(key)
// 	const listener = {
// 		fn,
// 		keep: false
// 	}

// 	if (!instance[listeners]) {
// 		create(instance, key)
// 	}

// 	instance[listeners].push(listener)
// 	return () => remove(instance, key, listener)
// }

let resolve = null
let promise = new Promise(res => { resolve = res })
let scheduled = new Set()
const add = scheduled.add.bind(scheduled)

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
			.forEach(listener => Util.execute(listener.cleanup, false))
		instance[listeners].forEach(add)
		instance[listeners]
			.filter(listener => !listener.keep)
			.forEach(listener => remove(listener))
	}
}

const applyUpdate = () => {
	scheduled.forEach(listener => {
		const value = listener.key ? listener.instance[listener.key] : listener.instance
		listener.cleanup = listener.fn(value)
	})
	scheduled.clear()

	resolve()
	promise = new Promise(res => { resolve = res })
}

const applyAllUpdates = () => {
	let guard = 0
	while(scheduled.size > 0 && guard < 100) {
		applyUpdate()
		guard += 1
	}
	if (guard === 100) {
		throw new Error('apply updates has reached maximum iterations.')
	}
}

const hasListener = (instance, key) => {
	const listeners = listenerKey(key)
	return (instance[listeners] && instance[listeners].length > 0)	
}

const listenerKey = key => key ? `${key}Listeners` : 'listeners'

const shared = fn => {
	let destroyScheduled = 0
	let destroyExecuted = 0
	let destroy = null
	return arg => {
		if (destroy) {
			Util.execute(destroy)
			destroyExecuted += 1
		}
		destroy = fn(arg) || doNothing
		return () => {
			destroyScheduled += 1
			if (destroyScheduled > destroyExecuted) {
				Util.execute(destroy)
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
	hasListener,
	listenerKey,
	shared,
	map,
	applyUpdate,
	applyAllUpdates,
}