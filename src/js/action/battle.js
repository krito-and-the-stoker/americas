import Record from 'util/record'
import Util from 'util/util'

import Time from 'timeline/time'

import Unit from 'entity/unit'

import UnitView from 'view/unit'

import Message from 'view/ui/message'
import Notification from 'view/ui/notification'

export default (attacker, other) => {
	Time.schedule({ priority: true, init: () => {	
		if (!Util.inBattleDistance(attacker, other)) {
			return false
		}

		// console.log('radius', attacker.radius)
		// console.log('attacker', attacker)
		// console.log('attacking', other)

		// console.log(Record.getAll('unit')
		// 	.filter(unit => unit.owner === other.owner))
		// console.log(Record.getAll('unit')
		// 	.filter(unit => unit.owner === other.owner)
		// 	.map(unit => unit.radius))
		// console.log(Record.getAll('unit')
		// 	.filter(unit => unit.owner === other.owner)
		// 	.map(unit => Util.distance(unit.mapCoordinates, attacker.mapCoordinates)))
		// console.log(Record.getAll('unit')
		// 	.filter(unit => unit.owner === other.owner)
		// 	.filter(unit => Util.inBattleDistance(unit, attacker)))
		// console.log(Record.getAll('unit')
		// 	.filter(unit => unit.owner === other.owner)
		// 	.filter(unit => Util.inBattleDistance(unit, attacker))
		// 	.reduce((best, unit) => Unit.strength(best) < Unit.strength(unit) ? unit : best, other))

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
	}})
}