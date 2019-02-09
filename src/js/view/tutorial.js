import Messages from 'data/tutorial'

import Util from 'util/util'
import Record from 'util/record'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Dialog from 'view/ui/dialog'


const messageFunctions = {
	select: {
		subscribe: () => Events.listen('select', () => {
			markDone('select')
		})
	},
	move: {
		subscribe: () => Record.getAll('unit').map(unit =>
			Unit.listen.mapCoordinates(unit, coords => {
				if (coords.x < unit.tile.mapCoordinates.x) {
					markDone('move')
				}
			}))
	},
	landfall: {
		subscribe: () => Events.listen('discovery', () => {
			markDone('landfall')
		})		
	},
	disembark: {
		subscribe: () => Events.listen('disembark', () => {
			markDone('disembark')
		})		
	},
	colony: {
		subscribe: () => Events.listen('found', () => {
			markDone('colony')
		})		
	},
	immigration: {
		subscribe: () => Events.listen('immigration', () => {
			markDone('immigration')
		})
	}
}

const prepareMessage = message => {
	message.valid = true
	message.shown = false
	const funcs = messageFunctions[message.name]
	if (funcs) {
		Object.keys(funcs).forEach(key => {
			message[key] = funcs[key]
		})
	}

	return message
}
const messages = Messages.map(prepareMessage)


const show = message => {
	message.shown = true
	Dialog.create({
		text: message.text,
		type: 'menu',
		pause: true
	})
}

const init = () => {
	if (!Record.getGlobal('tutorial')) {
		Record.setGlobal('tutorial', {})
	}

	messages
		.filter(msg => msg.subscribe)
		.forEach(msg => {
			msg.unsubscribe = msg.subscribe()
		})
}
const markDone = name => {
	Record.getGlobal('tutorial')[name] = true
	const message = messages.find(msg => msg.name === name)
	Util.execute(message.unsubscribe)
	message.valid = false
}
const isDone = name => Record.getGlobal('tutorial')[name]
const nextMessage = () => messages.filter(msg => !isDone(msg.name)).find(msg => msg.preconditions.every(pre => isDone(pre)))
// const stop = () => messages.map(msg => msg.name).forEach(markDone)
const nextMessageTime = (currentTime, msg) => currentTime + 1000 * (msg.wait ? (msg.shown ? msg.wait.initial : msg.wait.repeat) : 0)
const initialize = () => {
	init()

	let msg = nextMessage()
	let eta = 0
	Time.schedule({ update: currentTime => {
		if (!msg.valid) {
			msg = nextMessage()
			eta = nextMessageTime(currentTime, msg)
		}

		if (!eta) {
			eta = nextMessageTime(currentTime, msg)
		}

		if (currentTime >= eta) {
			show(msg)
			eta = nextMessageTime(currentTime, msg)
		}

		return true
	} })
}

export default { initialize }