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
	}
}, ({ name, type, unit, colony}) => {
	const init = () => {
		Events.trigger(name, { type, unit, colony })
	}

	return {
		init
	}
})
