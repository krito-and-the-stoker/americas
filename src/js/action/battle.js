import Record from 'util/record'
import Util from 'util/util'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import UnitView from 'view/unit'

import Message from 'view/ui/message'
import Notification from 'view/ui/notification'
import Events from 'view/ui/events'

export default (attacker, other) => {
	Time.schedule({ priority: true, init: () => {	
		if (!Util.inBattleDistance(attacker, other)) {
			return false
		}

		const defender = Record.getAll('unit')
			.filter(unit => unit.owner === other.owner)
			.filter(unit => Util.inBattleDistance(unit, other))
			.reduce((best, unit) => Unit.strength(best) < Unit.strength(unit) ? unit : best, other)

		Unit.update.radius(attacker, 0)

		let probability = {
			attacker: Math.pow(Unit.strength(attacker), 2),
			defender: Math.pow(Unit.strength(defender), 2),
		}

		const chance = Math.random() * (probability.attacker + probability.defender)
		Unit.remove.hostile(attacker, defender)

		const attackerName = UnitView.getName(attacker)
		const defenderName = UnitView.getName(defender)
		if (chance < probability.attacker) {
			Message.send(`A ${attackerName} defeated a ${defenderName} on the battle field`)
			Notification.create({ type: 'combat', attacker, defender, loser: defender })
			Unit.disband(defender)
		} else {
			Message.send(`A ${defenderName} defeated a ${attackerName} on the battle field`)
			Notification.create({ type: 'combat', attacker, defender, loser: attacker })
			Unit.disband(attacker)
		}
		const coords = {
			x: (attacker.mapCoordinates.x + defender.mapCoordinates.x) / 2,
			y: (attacker.mapCoordinates.y + defender.mapCoordinates.y) / 2,
		}
		Events.trigger('combat', coords)
	}})
}