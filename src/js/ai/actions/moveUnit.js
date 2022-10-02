import Util from 'util/util'
import Events from 'util/events'
import Message from 'util/message'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import TriggerEvent from 'command/triggerEvent'

import Plan from 'ai/plan'
import AssignUnit from 'ai/actions/assignUnit'
import CreateUnit from 'ai/actions/createUnit'


const create = ({ owner, unit, coords }) => {
	if (owner && !unit) {
		const prev = Plan.cheapest([
			AssignUnit.create({ owner, coords }),
			CreateUnit.create({ owner, coords })
		].filter(a => !!a).map(action => {
			action.cost += Util.distance(coords, action.coords)
			return action
		}))

		let cancel = [prev?.cancel]

		if (prev) {
			const move = {
				cost: prev.cost,
				commit: async () => {
					const unit = await prev.commit()
					move.unit = unit
					if (unit && Util.distance(unit.mapCoordinates, coords) > 0) {
						return await new Promise(resolve => {
							cancel.push(commit(unit, coords, () => resolve(unit)))
						})
					} else {
						return unit
					}
				},
				dismiss: () => Util.execute(prev.dismiss),
				cancel: () => Util.execute(cancel)
			}

			return move
		}

		return null
	}

	if (unit) {
		let cancel = null
		return {
			cost: Util.distance(coords, unit.mapCoordinates),
			unit,
			commit: () => new Promise(resolve => {
				cancel = commit(unit, coords, resolve)

				return unit
			}),
			cancel: () => Util.execute(cancel)
		}
	}

	Message.warn('moveUnit action needs either a unit or an owner.')
}


const commit = (unit, coords, resolve) => {
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords }))
	Commander.scheduleBehind(unit.commander, TriggerEvent.create({ name: 'ai-move-unit-complete', id: unit.referenceId }))

	let cancel = () => {
		Commander.clearSchedule(unit.commander)
		Util.execute(unsubscribe)
	}

	const done = () => {
		Util.execute(unsubscribe)
		Util.execute(resolve)
	}

	const unsubscribe = [
		Events.listen('ai-move-unit-complete', params => {
			if (params.id === unit.referenceId) {
				done()
			}
		}),
		Events.listen('disband', params => {
			if (params.unit.referenceId === unit.referenceId) {
				done()
			}
		})
	]

	// bind cancel to current scope so we can update it when the move is complete
	return cancel
}


export default {
	create,
}