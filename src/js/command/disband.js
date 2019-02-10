import Record from 'util/record'
import Decorators from 'util/decorators'

import Unit from 'entity/unit'


const create = Decorators.ensureArguments(1, unit => {
	const init = () => {
		Unit.disband(unit)
	}

	const save = () => ({
		module: 'Disband',
		unit: Record.reference(unit)
	})

	return {
		init,
		save
	}
})

const load = data => {
	return create(Record.dereference(data.unit))
}

export default { create, load }