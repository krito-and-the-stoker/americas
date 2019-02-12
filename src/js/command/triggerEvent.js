import Events from 'util/events'

import Factory from 'command/factory'


export default Factory.create('TriggerEvent', {
	name: {
		type: 'raw',
		required: true
	},
	type: {
		type: 'raw'
	},
	unit: {
		type: 'entity',
	},
	colony: {
		type: 'entity'
	},
	id: {
		type: 'raw'
	},
	wait: {
		type: 'raw',
		default: 0
	},
	eta: {
		type: 'raw'
	}
}, ({ name, type, unit, colony, id, wait, eta }) => {
	const init = currentTime => {
		eta = currentTime + wait
		return {
			eta
		}
	}

	const update = currentTime => eta && currentTime < eta 
	const finished = () => {
		Events.trigger(name, { type, unit, colony, id })
	}

	return {
		init,
		update,
		finished
	}
})
