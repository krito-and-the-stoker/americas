import 'util/polyfills'

import UnitProperties from 'data/units'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'
import Events from 'util/events'
import Message from 'util/message'

import Time from 'timeline/time'

import ProbabilisticTrigger from 'task/probabilisticTrigger'

import Battle from 'interaction/battle'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Tribe from 'entity/tribe'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

import EstablishRelations from 'ai/actions/establishRelations'
import Disband from 'ai/actions/disband'
import VisitColony from 'ai/actions/visitColony'
import RaidColony from 'ai/actions/raidColony'

import State from 'ai/state'
import Units from 'ai/resources/units'
import Goods from 'ai/resources/goods'


const MILITANCY_UPDATE_FACTOR = 1.0 / (Time.YEAR)
const MILITANCY_DECAY_FACTOR = 1.0
const TRUST_DECAY_FACTOR = 1.0

const describeRelations = relations => {
	const debugInfo = `(trust: ${relations.trust.toFixed(2)}, mil: ${relations.militancy.toFixed(2)})`
	if (relations.militancy > 0.5) {	
		if (relations.trust >= 0.5) {
			return `warmongering ${debugInfo}`
		}

		if (relations.trust >= 0) {
			return `hostile ${debugInfo}`
		}

		return `hateful ${debugInfo}`
	}

	if (relations.militancy > 0) {
		if (relations.trust >= 0.5) {
			return `friendly ${debugInfo}`
		}

		if (relations.trust >= 0) {
			return `neutral ${debugInfo}`
		}

		return `tense ${debugInfo}`
	}

	if (relations.trust >= 0.5) {
		return `happy ${debugInfo}`
	}

	if (relations.trust >= 0) {
		return `cordial ${debugInfo}`
	}

	return `submissive ${debugInfo}`
}



const initialize = ai => {
	Util.execute(ai.destroy)

	return [
		listen.tribe(ai, tribe => 
			tribe && Tribe.listen.settlements(tribe, settlements => {
				const tiles = settlements
					.map(settlement => Util.quantizedRadius(settlement.mapCoordinates, 4))
					.flat()
					.map(coords => MapEntity.tile(coords))
					.filter(Util.unique)
					.filter(tile => tile.domain === 'land')
					.filter(tile => settlements.map(settlement => MapEntity.tile(settlement.mapCoordinates).area).includes(tile.area))
				// for all tiles near settlements:
				return tiles.map(tile => [
					// greet unknowns
					Tile.listen.units(tile, units => {
						units
							.filter(unit => unit.domain !== 'sea' && !unit.vehicle)
							.map(unit => unit.owner)
							.filter(owner => owner !== ai.owner)
							.forEach(owner => {
								if (!ai.state.relations[owner.referenceId]) {
									ai.state.relations[owner.referenceId] = {
										established: false,
										war: false,
										colonies: {},
										militancy: 0,
										trust: 0,
									}

									update.state(ai)
								}
							})
					}),

					// register foreign colony
					Tile.listen.colony(tile, colony => {
						if (colony && !ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId]) {
							ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId] = {
								visited: false,
								raidPlanned: false
							}
							update.state(ai)

							return () => {
								delete ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId]
							} 
						}
					}),
				])
			})),

		listen.state(ai, () => {
			makePlansAndRunThem(ai)
		}),

		Time.schedule(({ update: (currentTime, deltaTime) => {
			Object.values(ai.state.relations).forEach(relations => {
				relations.militancy = Util.clamp(MILITANCY_DECAY_FACTOR * relations.militancy - deltaTime * MILITANCY_UPDATE_FACTOR * relations.trust, 0, 3)
				relations.trust = Util.clamp(relations.trust * TRUST_DECAY_FACTOR, -1, 1)
			})

			return true
		}})),

		Events.listen('meet', ({ unit, other }) => {
			if (unit && other) {			
				const relations = ai.state.relations[other.owner.referenceId]
				if (relations) {
					// establish relations
					if (unit.owner === ai.owner && other.domain === 'land' && !relations.established) {
						establishRelations(ai, other.owner)
					}
					// battle when in war
					if (relations.war) {
						if (unit.domain === other.domain) {
							if (unit.owner === ai.owner && !other.colony) {
								Message.log('attacking hostile', unit, other)
								Battle(unit, other)
							}
						}
					}

					// TODO: move this to a more appropriate place
					// auto attack natives when in state of war
					if (other.owner === ai.owner) {
						const relations = ai.state.relations[unit.owner.referenceId]
						if (relations.war) {
							if (unit.domain === other.domain && !unit.properties.support && Unit.strength(unit) > 2 && Unit.strength(unit) > 2 * Unit.strength(other)) {
								Message.log('defending hostile', unit, other)
								Battle(unit, other)
							}
						}
					}
				}
			}
		})
	]
}

const establishRelations = (ai, owner) => {
	ai.state.relations[owner.referenceId].established = true
	if (owner.type === 'player') {
		const numSettlements = Record.getAll('settlement').filter(settlement => settlement.tribe === ai.tribe).length
		Events.trigger('dialog', {
			type: 'natives',
			image: ai.tribe.image,
			text: `Hello strange men from the sea. We are the **${ai.tribe.name}** and live here in *${numSettlements} settlements*. We welcome you in **peace**.<options/>`,
			pause: true,
			options: [{
				text: 'Let us live together in peace.',
			}, {
				text: 'You are heathens and deserve to die! (**Declare War**)',
				action: () => {
					ai.state.relations[owner.referenceId].trust -= 1.0
					ai.state.relations[owner.referenceId].war = true
					update.state(ai)
				}
			}]
		})
	}
}



const makePlansAndRunThem = ai => {
	console.log('make new plans')
	Util.execute(ai.stopAllPlans)
	let plansActive = 0

	Time.schedule({
		init: () => {
			Units.unassignAll(ai.owner)

			const executeAction = action => {
				if (action) {
					plansActive += 1
					action.commit().then(() => {
						plansActive -= 1
						if (!plansActive) {
							makePlansAndRunThem(ai)
						}
					})
					return action.cancel
				}
			}

			Object.values(ai.state.relations)
				.filter(relation => relation.war && relation.militancy > 0.5)
				.forEach(relation => {
					const colonies = State.all(relation, 'colonies')
						// .filter(colony => !relation.colonies[colony.referenceId].raidPlanned)

					let raiders = Math.round(relation.militancy * 20)
					relation.militancy = 0.0

					while(raiders > 0) {
						const colony = Util.choose(colonies)
						let amount = Math.ceil(Math.random() * raiders)
						if (!relation.colonies[colony.referenceId].raidPlanned) {
							relation.colonies[colony.referenceId].raidPlanned = amount
						} else {
							relation.colonies[colony.referenceId].raidPlanned += amount
						}

						raiders -= amount
					}
				})

			ai.stopAllPlans = [
				// establish contact with all strangers
				State.all(ai.state, 'relations')
					.filter(contact => !ai.state.relations[contact.referenceId].established)
					.map(contact => EstablishRelations.create({ owner: ai.owner, contact }))
					.map(executeAction),

				// visit new colonies
				Object.entries(ai.state.relations)
					.map(([referenceId, relation]) => State.all(relation, 'colonies')
						.filter(colony => colony && !ai.state.relations[referenceId].colonies[colony.referenceId].visited)
						.map(colony => VisitColony.create({ tribe: ai.tribe, state: ai.state, colony }))
						.map(executeAction)),

				// raid colonies
				Object.entries(ai.state.relations)
					.map(([referenceId, relation]) => State.all(relation, 'colonies')
						.filter(colony => colony && ai.state.relations[referenceId].colonies[colony.referenceId].raidPlanned > 0)
						.map(colony => RaidColony.create({ tribe: ai.tribe, state: ai.state, colony }))
						.map(executeAction)),

				// collect free and unused units
				Units.free(ai.owner)
					.map(unit => Disband.create(unit))
					.map(executeAction),
			]

			if (!plansActive) {
				makePlansAndRunThem(ai)
			}
		}
	})
}

const create = owner => {
	const ai = {
		owner,
		tribe: null,
		contacts: [],
		state: {
			relations: {},
		},
	}

	ai.destroy = initialize(ai)

	return ai
}

const load = ai => {
	Record.dereferenceLazy(ai.owner, owner => { ai.owner = owner })

	Record.entitiesLoaded(() => {
		ai.tribe = Record.dereference(ai.tribe)
		initialize(ai)
	}, 100)

	return ai
}

const save = ai => ({
	owner: Record.reference(ai.owner),
	tribe: Record.reference(ai.tribe),
	state: ai.state,
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
	save,
	describeRelations
}