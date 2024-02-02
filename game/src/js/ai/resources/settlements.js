import Util from 'util/util'
import Record from 'util/record'

import Time from 'timeline/time'

import Storage from 'entity/storage'

import Units from 'ai/resources/units'

let reservedPopulation = {}
let lastReserved = {}
const reserved = settlement => reservedPopulation[settlement.referenceId] || 0
const reserve = settlement => {
	lastReserved[settlement.referenceId] = Time.get().currentTime
	reservedPopulation[settlement.referenceId] = reserved(settlement) + 1
	return cost(settlement)
}
const cost = settlement => {
	const population = settlement.population - reserved(settlement)
	// const deltaYear = Util.clamp((Time.get().currentTime - (lastReserved[settlement.referenceId] || 0)) / Time.YEAR)

	return Util.clamp(100/(population+1), 1, 1)
}

const unreserve = settlement => {
	reservedPopulation[settlement.referenceId] = reserved(settlement) - 1
}

const cheapest = (owner, coords) => {
	const settlements = Record.getAll('settlement')
		.filter(settlement => settlement.owner === owner)
		.filter(settlement => settlement.population + reserved(settlement) > 1)
		.filter(settlement => !lastReserved[settlement.referenceId] || lastReserved[settlement.referenceId] < Time.get().currentTime)
	return Util.min(settlements, settlement =>
		2 * Util.distance(settlement.mapCoordinates, coords) + cost(settlement))	
}

const recruit = settlement => {
	const unit = Units.create('native', settlement)
	// settlement.population -= 1
	if (settlement.tribe.storage.guns >= 20) {
		Storage.transfer(settlement.tribe.storage, unit.equipment, { good: 'guns', amount: 20 })
	}
	if (settlement.tribe.storage.horses >= 20) {
		Storage.transfer(settlement.tribe.storage, unit.equipment, { good: 'horses', amount: 20 })
	}

	return unit	
}

export default {
	cheapest,
	reserve,
	unreserve,
	recruit
}