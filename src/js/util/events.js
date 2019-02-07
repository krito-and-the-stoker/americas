// import Message from 'util/message'

let listeners = {}

const init = name => {
	listeners[name] = []
}

const trigger = (name, arg) => {
	// console.log(`Event: ${name}`, arg)
	if (listeners[name]) {
		listeners[name].forEach(fn => fn(arg))
	}
}

const remove = (name, fn) => {
	if (listeners[name]) {
		listeners[name] = listeners[name].filter(f => f !== fn)
	}
}

const listen = (name, fn) => {
	if (!listeners[name]) {
		init(name)
	}

	listeners[name].push(fn)

	return () => remove(name, fn)
}


export default {
	trigger,
	remove,
	listen
}