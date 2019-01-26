import Unit from 'entity/unit'
import Record from 'util/record'

const create = unit => {
	const init = () => {
		Unit.disband(unit)
	}

	const save = () => ({
		type: 'disband',
		unit: Record.reference(unit)
	})

	return {
		init,
		save
	}
}

const load = data => {
	return create(Record.dereference(data.unit))
}

export default { create, load }