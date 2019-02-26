import 'util/polyfills'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'
import Events from 'util/events'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Tribe from 'entity/tribe'

import EstablishRelations from 'ai/actions/establishRelations'
import Disband from 'ai/actions/disband'
import VisitColony from 'ai/actions/visitColony'

import State from 'ai/state'
import Units from 'ai/resources/units'


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
										colonies: {}
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
							update.state(ai)

							return () => {
								delete ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId]
							} 
						}
					})
				])
			}) : null),

		listen.state(ai, () => {
			makePlansAndRunThem(ai)
		}),

		Events.listen('meet', ({ unit, other }) => {
			if (unit.owner === ai.owner && !ai.state.relations[other.owner.referenceId].established) {
				establishRelations(ai, other.owner)
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

		// collect free and unused units
		Units.free(ai.owner)
			.map(unit => Disband.create(unit))
			.map(executeAction),

		// raid colonies
		// Object.entries(ai.state.relations)
		// 	.map(([referenceId, relation]) => State.all(relation, 'colonies')
		// 		.map(colony => ({
		// 			key: ['relations', referenceId, 'colonies', colony.referenceId, 'raidPlanned'],
		// 			value: true,
		// 			name: `raid-${colony.referenceId}`
		// 		}))).flat()
		// 	.filter(goal => !State.satisfies(ai.state, goal))
		// 	.map(executePlan),
	]
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
	save
}