import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'
import LA from 'util/la'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import Move from 'task/move'

import Raid from 'interaction/raid'

import State from 'ai/state'

import GetUnit from 'ai/actions/getUnit'
import Disband from 'ai/actions/disband'

import Units from 'ai/resources/units'


const findTargets = relations => State.all(relations, 'colonies')
	.map(colony => ({
		mapCoordinates: colony.mapCoordinates,
		attractivity: colony.colonists.length
	}))

const create = ({ tribe, state, colony }) => {
	const relations = state.relations[colony.owner.referenceId]
	Message.log('starting raid on', colony.name, state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
	const unitPlans = Util.range(state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned)
		.map(() => GetUnit.create({ owner: tribe.owner, coords: colony.mapCoordinates })).filter(a => !!a)

	if (unitPlans.length > 0) {
		let cancelDisband = []
		return {
			cancel: () => {
				Util.execute(unitPlans.map(plan => plan.cancel))
				Util.execute(cancelDisband)
			},
			dismiss: () => Util.execute(unitPlans.dismiss),
			commit: () => {
				const findTarget = unit => {
					const targets = findTargets(relations)
					const weight = target => target.attractivity

					return LA.multiply(
						1.0 / Util.sum(targets.map(weight)),
						targets.reduce((sum, target) => LA.madd(sum, weight(target), target.mapCoordinates), { x: 0, y: 0 })
					)
				}

				return Promise.all(unitPlans.map(plan => new Promise(resolve => {
					// first get unit
					plan.commit().then(unit => {
						if (!unit) {
							resolve()
							return
						}

						let isRaiderActive = true
						const unsubscribe = [
							// raid when in range
							Events.listen('meet', params => {
								if (params.colony === colony && params.unit === unit) {
									if(Raid(colony, params.unit)) {
										isRaiderActive = false
									}
								}
							}),

							// if unit gets too scared it just retreats
							Events.listen('retreat', params => {
								if (params.unit === unit) {
									console.log('retreat!', params.unit)
									isRaiderActive = false
								}
							})
						]

						Unit.goTo(unit, null)
						
						Time.schedule({
							// control unit
							update: (_, deltaTime) => {
								const coords = findTarget(unit)
								const direction = LA.subtract(coords, unit.mapCoordinates)
								if (LA.distanceManhatten(direction) > 0) {
									Move.moveUnit(unit, direction, deltaTime)
								}

								return isRaiderActive
							},

							// release unit control
							finished: () => {
								state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned -= 1
								if (state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned < 0) {
									state.relations[colony.owner.referenceId].colonies[colony.referenceId].raidPlanned = 0
								}

								if (!unit.disbanded) {
									Units.unassign(unit)
			
									const disbandAction = Disband.create(unit)
									cancelDisband.push(disbandAction.commit())						
								}

								Util.execute(unsubscribe)
								resolve()
							},

							priority: true,
						})
					})
				})))
			}
		}
	}

	return null
}


export default {
	create
}