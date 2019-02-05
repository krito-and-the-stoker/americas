import Util from 'util/util'
import Record from 'util/record'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Dialog from 'view/ui/dialog'


const interval = 15000
const messages = [
	{
		name: 'select',
		preconditions: [],
		text: 'Click on your caravel to select it',
		type: 'naval',
		subscribe: () => Events.listen('select', () => {
			markDone('select')
		})
	}, {
		name: 'go',
		preconditions: ['select'],
		text: 'Right-click somewhere on the map to the west to go there',
		type: 'naval',
		subscribe: () => Record.getAll('unit').map(unit =>
			Unit.listen.mapCoordinates(unit, coords => {
				if (coords.x < unit.tile.mapCoordinates.x) {
					markDone('go')
				}
			}))
	}, {
		name: 'land',
		preconditions: ['go'],
		text: 'Sail to the west, there will be land',
		type: 'naval',
		subscribe: () => Events.listen('discovery', () => {
			markDone('land')
		})
	}, {
		name: 'disembark',
		preconditions: ['land'],
		text: 'Disembark a passanger by targeting land with your ship',
		type: 'naval',
		subscribe: () => Events.listen('disembark', () => {
			markDone('disembark')
		})
	}, {
		name: 'colony',
		preconditions: ['disembark'],
		text: 'Found a colony',
		type: 'scout',
		subscribe: () => Events.listen('found', () => {
			markDone('colony')
		})
	}
]


const create = message => {
	Dialog.create({
		type: message.type,
		text: message.text,
		pause: true
		// options: [{
		// 	text: 'Ok, thank you.'
		// }, {
		// 	text: 'I know what I am doing (skip tutorial)',
		// 	action: () => stop()
		// }]
	})
}

const init = () => {
	if (!Record.getGlobal('tutorial')) {
		Record.setGlobal('tutorial', {})
	}

	messages.forEach(msg => {
		msg.unsubscribe = msg.subscribe()
	})
}
const markDone = name => {
	Record.getGlobal('tutorial')[name] = true
	// console.log(name, messages.find(msg => msg.name === name))
	Util.execute(messages.find(msg => msg.name === name).unsubscribe)
}
const isDone = name => Record.getGlobal('tutorial')[name]
const message = () => messages.filter(msg => !isDone(msg.name)).find(msg => msg.preconditions.every(pre => isDone(pre)))
const stop = () => messages.map(msg => msg.name).forEach(markDone)

const initialize = () => {
	init()

	let eta = 0
	Time.schedule({ update: currentTime => {
		if (!eta) {
			eta = currentTime + interval
		}

		if (currentTime >= eta) {
			const msg = message()
			if (msg) {
				create(msg)
				eta = currentTime + interval
			}
		}

		return true
	}})
}

export default { initialize }