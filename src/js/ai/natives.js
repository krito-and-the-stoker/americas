import 'util/polyfills'

import Util from 'util/util'
import Binding from 'util/binding'
// import Member from 'util/member'
import Record from 'util/record'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Tribe from 'entity/tribe'


const initialize = ai => {
	Util.execute(ai.destroy)

	return [
		listen.tribe(ai, tribe =>
			tribe ? Tribe.listen.settlements(tribe, settlements => {
				const tiles = settlements
					.map(settlement => Util.quantizedRadius(settlement.mapCoordinates, 3))
					.flat()
					.map(coords => MapEntity.tile(coords))
					.filter(Util.unique)
				return tiles.map(tile =>
					Tile.listen.units(tile, units => {
						units
							.filter(unit => unit.domain !== 'sea')
							.map(unit => unit.owner)
							.forEach(contact => {
								if (!ai.state.relations[contact.referenceId]) {
									ai.state.relations[contact.referenceId] = {
										established: false
									}
								}
							})
					}))
			}) : null),

		listen.state(ai, state => {
			const goals = []
			Object.entries(state.relations)
				.filter(([,relation]) => !relation.established)
				.forEach(([contact]) => {
					const goal = {
						key: ['relations', contact, 'established'],
						value: true
					}
					goals.push(goal)
				})
			update.goals(ai, goals)
		}),

		listen.goals(ai, goals => {
			goals.forEach(goal => {
				console.log('trying to fullfill', goal, 'dont know how yet :/')
			})
		})
	]
}

const create = owner => {
	const ai = {
		owner,
		tribe: null,
		contacts: [],
		state: {
			relations: {}
		},
		goals: []
	}

	ai.destroy = initialize(ai)

	return ai
}

const load = ai => {
	Record.dereferenceLazy(ai.owner, owner => { ai.owner = owner })
	ai.goals = []

	Record.entitiesLoaded(() => {
		initialize(ai)
	})

	return ai
}

const save = ai => ({
	owner: Record.reference(ai.owner),
	state: ai.state
})

const listen = {
	state: (ai, fn)=> Binding.listen(ai, 'state', fn),
	tribe: (ai, fn) => Binding.listen(ai, 'tribe', fn),
	goals: (ai, fn)=> Binding.listen(ai, 'goals', fn)
}

const update = {
	state: ai => Binding.update(ai, 'state'),
	tribe: (ai, value) => Binding.update(ai, 'tribe', value),
	goals: (ai, goals) => Binding.update(ai, 'goals', goals)
}

// const add = {
// 	contact: (ai, member) => Member.add(ai, 'contacts', member)
// }

export default {
	create,
	update,
	listen,
	load,
	save
}