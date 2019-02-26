import Settlements from 'ai/resources/settlements'

const create = ({ owner, coords }) => {
	const settlement = Settlements.cheapest(owner, coords)
	console.log('creating costs', Settlements.reserve(settlement))
	Settlements.unreserve(settlement)

	return {
		cost: Settlements.reserve(settlement),
		coords: settlement.mapCoordinates,
		commit: () => commit(settlement),
		dismiss: () => Settlements.unreserve(settlement)
	}
}

const commit = settlement => {
	Settlements.unreserve(settlement)
	return Settlements.recruit(settlement)
}

export default {
	create,
}