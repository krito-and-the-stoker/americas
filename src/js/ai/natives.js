import 'util/polyfills'

import UnitProperties from 'data/units'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'
import Events from 'util/events'

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


const MILITANCY_UPDATE_FACTOR = 1.0 / (1*Time.YEAR)
const MILITANCY_DECAY_FACTOR = 0.999
const TRUST_DECAY_FACTOR = 0.999

const offensiveCapability = ai => {
	let offense = 1
	if (ai.tribe.storage.guns >= 25 && ai.tribe.storage.horses >= 25) {
		offense = UnitProperties.mountedarmednative.combat
	}
	if (ai.tribe.storage.guns >= 25 && ai.tribe.storage.horses < 25) {
		offense = UnitProperties.armednative.combat
	}
	if (ai.tribe.storage.guns < 25 && ai.tribe.storage.horses >= 25) {
		offense = UnitProperties.mountednative.combat
	}
	if (ai.tribe.storage.guns < 25 && ai.tribe.storage.horses < 25) {
		offense = UnitProperties.native.combat
	}

	return offense
}

const colonyRaidProbability = (t, colony, ai) => {
	const offset = 10
	if (t < offset) {
		return 0
	}

	const relations = ai.state.relations[colony.owner.referenceId]
	if (relations.trust > 0.8 || relations.militancy <= 0) {
		return 0
	}

	const attraction = Util.clamp(1 - relations.trust) * relations.militancy * Goods.value(colony.storage)
	const protection = Colony.protection(colony)
	const offense = offensiveCapability(ai)
	const defense = 100 * protection * protection / Util.clamp(offense*offense + relations.militancy, 0.1, 100 * protection * protection)

	if (defense > attraction) {
		// console.log(`${colony.name}: ${Math.round(attraction)} vs ${Math.round(defense)}`)
		return 0
	}

	const time = 1000 * defense / (attraction - defense)

	// console.log(`${colony.name}: ${Math.round(attraction)} vs ${Math.round(defense)} (${Math.round(time)})`)

	return 1 / time
}

const watch = (ai, colony) => {
	// console.log('watching', colony.name)
	return Time.schedule(ProbabilisticTrigger.create(t => colonyRaidProbability(t, colony, ai), () => {
		ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = Math.ceil(1.25*Colony.protection(colony))
		update.state(ai)
	}))
}

const describeRelations = relations => {
	if (relations.militancy > 1.0) {	
		if (relations.trust >= 0.6) {
			return `proud (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
		}

		if (relations.trust >= 0) {
			return `alert (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
		}

		return `hostile (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
	}

	if (relations.militancy > 0) {
		if (relations.trust >= 0.6) {
			return `friendly (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
		}

		if (relations.trust >= 0) {
			return `reserved (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
		}

		return `nervous (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
	}

	if (relations.trust >= 0.6) {
		return `happy (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
	}

	if (relations.trust >= 0) {
		return `cordial (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
	}

	return `submissive (${Math.round(10 * relations.trust) / 10}, ${Math.round(10 * relations.militancy) / 10})`
}



const initialize = ai => {
	Util.execute(ai.destroy)

	return [
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
										colonies: {},
										militancy: 0,
										trust: 0.1,
									}

									update.state(ai)
								}
							})
					}),

					Tile.listen.colony(tile, colony => {
						if (colony && !ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId]) {
							ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId] = {
								visited: false,
								raidPlanned: false
							}
							ai.state.relations[colony.owner.referenceId].trust -= 0.07
							update.state(ai)

							return () => {
								delete ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId]
							} 
						}
					}),

					Tile.listen.colony(tile, colony => {
						if (colony) {
							return watch(ai, colony)
						}
					}),
				])
			}) : null),

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
					if (unit.owner === ai.owner && other.domain === 'land' && !relations.established) {
						establishRelations(ai, other.owner)
					}
					if (relations.trust < 0 && relations.militancy > 1.5) {
						if (unit.domain === other.domain) {
							if (unit.owner === ai.owner && !other.colony) {
								console.log('attacking hostile', unit, other)
								Battle(unit, other)
								makePlansAndRunThem(ai)
							}
						}
					}

					// TODO: move this to a more appropriate place
					// auto attack natives when in state of war
					if (other.owner === ai.owner) {
						const relations = ai.state.relations[unit.owner.referenceId]
						if (relations.trust < 0 && relations.militancy > 1.5) {
							if (unit.domain === other.domain && !unit.properties.support && Unit.strength(unit) > 2 && Unit.strength(unit) > 2 * Unit.strength(other)) {
								console.log('defending hostile', unit, other)
								Battle(unit, other)
								makePlansAndRunThem(ai)
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
			text: `Hello strange men from the sea. We are the ${ai.tribe.name} and live here in ${numSettlements} settlements. We welcome you in peace.`,
			pause: true,
			options: [{
				text: 'Let there be peace.',
			}]
		})
	}
}



const makePlansAndRunThem = ai => {
	Util.execute(ai.stopAllPlans)
	Time.schedule({
		init: () => {
			Units.unassignAll(ai.owner)

			const executeAction = action => {
				if (action) {
					action.commit().then(() => makePlansAndRunThem(ai))
					return action.cancel
				}
			}

			ai.stopAllPlans = [
				// establish contact with all strangers
				State.all(ai.state, 'relations')
					.filter(contact => !ai.state.relations[contact.referenceId].established)
					.map(contact => EstablishRelations.create({ owner: ai.owner, contact }))
					.map(executeAction),

				// visit new colonies
				Object.entries(ai.state.relations)
					.map(([referenceId, relation]) => State.all(relation, 'colonies')
						.filter(colony => !ai.state.relations[referenceId].colonies[colony.referenceId].visited)
						.map(colony => VisitColony.create({ tribe: ai.tribe, state: ai.state, colony }))
						.map(executeAction)),

				// raid colonies
				Object.entries(ai.state.relations)
					.map(([referenceId, relation]) => State.all(relation, 'colonies')
						.filter(colony => ai.state.relations[referenceId].colonies[colony.referenceId].raidPlanned > 0)
						.map(colony => ({
							action: RaidColony.create({ tribe: ai.tribe, state: ai.state, colony }),
							colony
						}))
						.map(({ action, colony }) => {
							if (action) {
								action.commit()
									.then(() => watch(ai, colony))
									.then(() => makePlansAndRunThem(ai))
								return action.cancel
							}
						})),

				// collect free and unused units
				Units.free(ai.owner)
					.map(unit => Disband.create(unit))
					.map(executeAction),
			]
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