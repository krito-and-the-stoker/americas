import Record from 'util/record'
import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Time from 'timeline/time'

import Unit from 'entity/unit'

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

		console.log('battle', chance, probability)

		const attackerName = Unit.name(attacker)
		const defenderName = Unit.name(defender)
		if (chance < probability.attacker) {
			Message.send(`A ${attackerName} defeated a ${defenderName} on the battle field`)
			Events.trigger('notification', { type: 'combat', attacker, defender, loser: defender })
			Unit.disband(defender)
			if (attacker.owner.type === 'natives') {
				const relation = attacker.owner.ai.state.relations[defender.owner.referenceId]
				relation.militancy += 0.1
				Storage.transfer(defender.equipment, attacker.owner.ai.tribe.storage)
			}
			if (defender.owner.type === 'natives') {
				const relation = defender.owner.ai.state.relations[attacker.owner.referenceId]
				relation.militancy -= 0.025
			}
		} else {
			Message.send(`A ${defenderName} defeated a ${attackerName} on the battle field`)
			Events.trigger('notification', { type: 'combat', attacker, defender, loser: attacker })
			Unit.disband(attacker)
			if (attacker.owner.type === 'natives') {
				const relation = attacker.owner.ai.state.relations[defender.owner.referenceId]
				relation.militancy -= 0.025
			}
			if (defender.owner.type === 'natives') {
				const relation = defender.owner.ai.state.relations[attacker.owner.referenceId]
				relation.militancy += 0.1
				Storage.transfer(attacker.equipment, attacker.owner.ai.tribe.storage)
			}
		}
		const coords = {
			x: (attacker.mapCoordinates.x + defender.mapCoordinates.x) / 2,
			y: (attacker.mapCoordinates.y + defender.mapCoordinates.y) / 2,
		}
		Events.trigger('combat', coords)
	}})
}