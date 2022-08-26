import Time from 'timeline/time'

import Wait from 'task/wait'

import Settlements from 'ai/resources/settlements'


const create = ({ owner, coords }) => {
	const settlement = Settlements.cheapest(owner, coords)
	let canceled = false

	return settlement && {
		cost: Settlements.reserve(settlement),
		coords: settlement.mapCoordinates,
		commit: () => new Promise(resolve => {
			Time.schedule(Wait.create(Math.random() * 3 * Time.MONTH, () => {
				if (!canceled) {
					resolve(commit(settlement))
				} else {
					resolve()
				}
			}))
		}),
		dismiss: () => Settlements.unreserve(settlement),
		cancel: () => {
			Settlements.unreserve(settlement)
			canceled = true
		}
	}
}

const commit = settlement => {
	Settlements.unreserve(settlement)
	return Settlements.recruit(settlement)
}

export default {
	create,
}