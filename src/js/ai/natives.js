import 'util/polyfills'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Tribe from 'entity/tribe'
import Unit from 'entity/unit'

import Plan from 'ai/plan'
import State from 'ai/state'


const initialize = ai => {
	Util.execute(ai.destroy)

	return [
		Record.listen('unit', unit => {
			if (unit.owner === ai.owner) {
				if (!ai.state.units[unit.referenceId]) {					
					ai.state.units[unit.referenceId] = {
						plan: 'none'
					}
				}

				return [
					Unit.listen.mapCoordinates(unit, coords => {
						ai.state.units[unit.referenceId].mapCoordinates = coords
					}),
					() => {
						delete ai.state.units[unit.referenceId]
					}
				]
			}
		}),

		Record.listen('settlement', settlement => {
			if (settlement.owner === ai.owner) {
				ai.state.settlements[settlement.referenceId] = {
					canCreateUnit: true,
					mapCoordinates: settlement.mapCoordinates
				}
				return () => {
					delete ai.state.settlements[settlement.referenceId]
				}
			}
		}),

		listen.tribe(ai, tribe =>
			tribe ? Tribe.listen.settlements(tribe, settlements => {
				const tiles = settlements
					.map(settlement => Util.quantizedRadius(settlement.mapCoordinates, 6))
					.flat()
					.map(coords => MapEntity.tile(coords))
					.filter(Util.unique)
				return tiles.map(tile =>
					Tile.listen.units(tile, units => {
						units
							.filter(unit => unit.tile.domain !== 'sea')
							.map(unit => unit.owner)
							.forEach(contact => {
								if (!ai.state.relations[contact.referenceId]) {
									ai.state.relations[contact.referenceId] = {
										established: false
									}
									update.state(ai)
								}
							})
					}))
			}) : null),

		listen.state(ai, () => {
			makePlansAndRunThem(ai)
		}),
	]
}

const makePlansAndRunThem = ai => {
	Util.execute(ai.stopAllPlans)
	State.cleanup(ai.state, [])

	ai.stop = [
		// establish contact with all strangers
		State.all(ai.state, 'relations')
			.map(contact => ({
				key: ['relations', contact.referenceId, 'established'],
				value: true,
				name: `contact-${contact.referenceId}`
			}))
			.filter(goal => !State.satisfies(ai.state, goal))
			.map(goal => {
				const plan = Plan.create(ai.state, goal, () => update.state(ai))
				if (plan) {
					return plan()
				} else {
					console.log('no plan could be formed to reach', goal)
				}
			}),

		//disband all idle units
		State.free(ai.state, 'units')
			.map(unit => ({
				key: ['units', unit.referenceId, 'scheduled'],
				value: 'disband',
				name: `disband-${unit.referenceId}`
			}))
			.filter(goal => !State.satisfies(ai.state, goal))
			.map(goal => {
				const plan = Plan.create(ai.state, goal, () => update.state(ai))
				if (plan) {
					return plan()
				} else {
					console.log('no plan could be formed to reach', goal)
				}
			}),
	]
}

const create = owner => {
	const ai = {
		owner,
		tribe: null,
		contacts: [],
		state: {
			owner: owner.referenceId,
			relations: {},
			units: {},
			settlements: {}
		},
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
}

const update = {
	state: ai => Binding.update(ai, 'state'),
	tribe: (ai, value) => Binding.update(ai, 'tribe', value),
}

export default {
	create,
	update,
	listen,
	load,
	save
}