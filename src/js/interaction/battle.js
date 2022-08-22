import Record from 'util/record'
import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Unit from 'entity/unit'
import Storage from 'entity/storage'

export default (attacker, other) => {
	if (!Util.inBattleDistance(attacker, other)) {
		return false
	}

	const defender = Record.getAll('unit')
		.filter(unit => unit.owner === other.owner)
		.filter(unit => Util.inBattleDistance(unit, other))
		.reduce((best, unit) => Unit.strength(best) < Unit.strength(unit) ? unit : best, other)

	Unit.update.radius(attacker, 0)
	Unit.update.radius(defender, 0)

	const strength = {
		attacker: Unit.strength(attacker),
		defender: Unit.strength(defender),
	}

	const probability = {
		attacker: Math.pow(strength.attacker, 2),
		defender: Math.pow(strength.defender, 2),
	}


	const chance = Math.random() * (probability.attacker + probability.defender)

	const attackerName = Unit.name(attacker)
	const defenderName = Unit.name(defender)
	let loser = null
	if (chance < probability.attacker) {
		loser = defender
		Message.send(`A ${attackerName} defeated a ${defenderName} on the battle field`)
		Events.trigger('notification', { type: 'combat', attacker, defender, loser, strength })
		Unit.disband(defender)
		if (attacker.owner.type === 'natives') {
			const relation = attacker.owner.ai.state.relations[defender.owner.referenceId]
			// relation.militancy += 0.1
			Storage.transfer(defender.equipment, attacker.owner.ai.tribe.storage)
		}
		if (defender.owner.type === 'natives') {
			const relation = defender.owner.ai.state.relations[attacker.owner.referenceId]
			// relation.militancy -= 0.1
		}
	} else {
		loser = attacker
		Message.send(`A ${defenderName} defeated a ${attackerName} on the battle field`)
		Events.trigger('notification', { type: 'combat', attacker, defender, loser, strength })
		Unit.disband(attacker)
		if (attacker.owner.type === 'natives') {
			const relation = attacker.owner.ai.state.relations[defender.owner.referenceId]
			// relation.militancy -= 0.1
		}
		if (defender.owner.type === 'natives') {
			const relation = defender.owner.ai.state.relations[attacker.owner.referenceId]
			// relation.militancy += 0.1
			Storage.transfer(attacker.equipment, defender.owner.ai.tribe.storage)
		}
	}
	const coords = {
		x: (attacker.mapCoordinates.x + defender.mapCoordinates.x) / 2,
		y: (attacker.mapCoordinates.y + defender.mapCoordinates.y) / 2,
	}
	Events.trigger('combat', { coords, attacker, defender, loser, strength })
}