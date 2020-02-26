import Time from 'timeline/time'

import Unit from 'entity/unit'

import Factory from 'command/factory'


export default Factory.create('LoadUnit', {
	transport: {
		type: 'entity',
		required: true
	},
	passenger: {
		type: 'entity',
		required: true
	},
	eta: {
		type: 'raw'
	}
}, {
	id: 'loadUnit',
	display: 'Boarding unit'
}, ({ transport, passenger, eta }) => {
	const init = currentTime => {
		eta = currentTime + Time.LOAD_TIME

		return {
			eta
		}
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		Unit.loadUnit(transport, passenger)
	}

	return {
		init,
		update,
		finished,
	}
})
