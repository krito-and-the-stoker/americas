import Unit from 'entity/unit'

import Factory from 'command/factory'


export default Factory.create('Disband', {
	unit: {
		type: 'entity',
		required: true
	}
}, {
	id: 'disband',
	display: 'Disbanding'
}, ({ unit }) => {
	const init = () => {
		Unit.disband(unit)
	}

	return {
		init
	}
})
