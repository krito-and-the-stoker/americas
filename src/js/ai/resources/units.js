import Record from 'util/record'
import Unit from 'entity/unit'

let created = {}
const init = owner => {
	created[owner.referenceId] = []
}
const assign = unit => {
	const owner = unit.owner
	if (!created[owner.referenceId]) {
		init(owner)
	}

	created[owner.referenceId].push(unit)
}

const unassign = unit => {
	const owner = unit.owner
	created[owner.referenceId] = created[owner.referenceId].filter(u => u !== unit)
}

const free = owner => {
	const all = Record.getAll('unit')
		.filter(unit => unit.owner === owner)

	return created[owner.referenceId] ? all.filter(unit => !created[owner.referenceId].includes(unit)) : all
}

const create = (name, settlement) => {
	settlement.population -= 1
	const unit = Unit.create(name, settlement.mapCoordinates, settlement.owner)
	assign(unit)

	return unit
}


export default {
	create,
	assign,
	unassign,
	free
}