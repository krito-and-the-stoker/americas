import Util from 'util/util'
import Events from 'util/events'

import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import TriggerEvent from 'command/triggerEvent'

import Plan from 'ai/plan'
import AssignUnit from 'ai/actions/assignUnit'
import CreateUnit from 'ai/actions/createUnit'


const create = ({ owner, unit, coords }) => {
	if (owner) {
		const prev = Plan.cheapest([
			AssignUnit.create({ owner, coords }),
			CreateUnit.create({ owner, coords })
		].filter(a => !!a).map(action => {
			action.cost += Util.distance(coords, action.coords)
			return action
		}))

		let cancel = null

		if (prev) {
			const move = {
				cost: prev.cost,
				commit: () => new Promise(resolve => {
					const unit = prev.commit()
					move.unit = unit
					if (Util.distance(unit.mapCoordinates, coords) > 0) {
						cancel = commit(unit, coords, () => resolve(unit))
					} else {
						resolve(unit)
					}
				}),
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

	console.warn('moveUnit action needs either a unit or an owner.')
}


const commit = (unit, coords, resolve) => {
	Commander.scheduleInstead(unit.commander, MoveTo.create({ unit, coords }))
	Commander.scheduleBehind(unit.commander, TriggerEvent.create({ name: 'ai-move-unit-complete', id: unit.referenceId }))

	let cancel = () => {
		Commander.clearSchedule(unit.commander)
		Util.execute(unsubscribe)
	}

	const unsubscribe = Events.listen('ai-move-unit-complete', params => {
		if (params.id === unit.referenceId) {
			Util.execute(unsubscribe)
			Util.execute(resolve)
		}
	})

	// bind cancel to current scope so we can update it when the move is complete
	return cancel
}


export default {
	create,
}