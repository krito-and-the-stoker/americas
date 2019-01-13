import Record from '../util/record'

const create = (tribe, coords) => {
	const settlement = {
		mapCoordinates: coords,
		tribe
	}

	Record.add('settlement', settlement)
	return settlement
}

const save = settlement => ({
	mapCoordinates: settlement.mapCoordinates,
	tribe: Record.reference(settlement.tribe)
})

const load = settlement => {
	settlement.tribe = Record.dereference(settlement.tribe)
	return settlement
}

export default {
	create,
	load,
	save
}