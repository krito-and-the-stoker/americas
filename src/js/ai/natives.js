import 'util/polyfills'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'
import Events from 'util/events'

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

		listen.tribe(ai, tribe => {
			if (tribe) {
				ai.state.tribe = tribe.referenceId
			}
		}),

		listen.tribe(ai, tribe => 
			tribe ? Tribe.listen.settlements(tribe, settlements => {
				const tiles = settlements
					.map(settlement => Util.quantizedRadius(settlement.mapCoordinates, 6))
					.flat()
					.map(coords => MapEntity.tile(coords))
					.filter(Util.unique)
					.filter(tile => tile.domain === 'land')
					.filter(tile => settlements.map(settlement => MapEntity.tile(settlement.mapCoordinates).area).includes(tile.area))
				return tiles.map(tile => [
					Tile.listen.units(tile, units => {
						units
							.filter(unit => unit.tile.domain !== 'sea')
							.map(unit => unit.owner)
							.filter(owner => owner !== ai.owner)
							.forEach(owner => {
								if (!ai.state.relations[owner.referenceId]) {
									ai.state.relations[owner.referenceId] = {
										established: false,
										colonies: {}
									}
									const unsubscribe = Events.listen('meet', ({ unit, other }) => {
										if (unit.owner === ai.owner && other.owner === owner) {
											establishRelations(ai, owner)
											unsubscribe()
										}
									})
									update.state(ai)
								}
							})
					}),

					Tile.listen.colony(tile, colony => {
						if (colony) {
							ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId] = {
								visited: false
							}
							update.state(ai)
						}
					})
				])
			}) : null),

		listen.state(ai, () => {
			makePlansAndRunThem(ai)
		}),
	]
}

const establishRelations = (ai, owner) => {
	ai.state.relations[owner.referenceId].established = true
	if (owner.type === 'player') {
		const numSettlements = Record.getAll('settlement').filter(settlement => settlement.tribe === ai.tribe).length
		Events.trigger('dialog', {
			type: 'natives',
			image: ai.tribe.image,
			text: `Hello strange men from the sea. We are the ${ai.tribe.name} and live here in ${numSettlements} settlements. We welcome you in peace.`,
			pause: true,
			options: [{
				text: 'Let there be peace.',
			}]
		})
	}
}



const makePlansAndRunThem = ai => {
	return 

	Util.execute(ai.stopAllPlans)
	State.cleanup(ai.state, [])

	const executePlan = goal => {
		const plan = Plan.create(ai.state, goal, () => { update.state(ai) })
		if (plan) {
			return plan()
		} else {
			console.warn('no plan could be formed to reach', goal)
		}
	}

	ai.stopAllPlans = [
		// establish contact with all strangers
		State.all(ai.state, 'relations')
			.map(contact => ({
				key: ['relations', contact.referenceId, 'established'],
				value: true,
				name: `contact-${contact.referenceId}`
			}))
			.filter(goal => !State.satisfies(ai.state, goal))
			.map(executePlan),

		// visit new colonies
		Object.entries(ai.state.relations)
			.map(([referenceId, relation]) => State.all(relation, 'colonies')
				.map(colony => ({
					key: ['relations', referenceId, 'colonies', colony.referenceId, 'visited'],
					value: true,
					name: `visit-${colony.referenceId}`
				}))).flat()
			.filter(goal => !State.satisfies(ai.state, goal))
			.map(executePlan),

		// disband all idle units
		State.free(ai.state, 'units')
			.map(unit => ({
				key: ['units', unit.referenceId, 'scheduled'],
				value: 'disband',
				name: `disband-${unit.referenceId}`
			}))
			.filter(goal => !State.satisfies(ai.state, goal))
			.map(executePlan),
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