import Util from 'util/util'
import Record from 'util/record'

import Units from 'ai/resources/units'

let reservedPopulation = {}
const reserved = settlement => reservedPopulation[settlement.referenceId] || 0
const reserve = settlement => {
	reservedPopulation[settlement.referenceId] = reserved(settlement) + 1
	return Math.max(15 - (settlement.population + reserved(settlement)), 1)
}
const unreserve = settlement => reservedPopulation[settlement.referenceId] = reserved(settlement) - 1


const create = ({ owner, coords }) => {
	const settlements = Record.getAll('settlement')
		.filter(settlement => settlement.owner === owner)
		.filter(settlement => settlement.population + reserved(settlement) > 1)
	const closest = Util.min(settlements, settlement =>
		Util.distance(settlement.mapCoordinates, coords))
	

	return {
		cost: reserve(closest),
		coords: closest.mapCoordinates,
		commit: () => commit(closest),
		dismiss: () => unreserve(closest)
	}
}

const commit = settlement => {
	unreserve(settlement)
	const unit = Units.create('native', settlement)

	return unit
}

export default {
	create,
}