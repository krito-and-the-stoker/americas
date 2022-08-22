import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Colony from 'entity/colony'
import Unit from 'entity/unit'

import Units from 'ai/resources/units'

export default (settlement, attacker) => {
	const defender = Units.create('native', settlement)

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

	if (chance < probability.attacker) {
		Unit.disband(defender)

		if (Math.random() * (settlement.population + 1) < 1) {
			Settlement.disband(settlement)

			const treasure = Unit.create('treasure', settlement.mapCoordinates)
			treasure.treasure = Math.round(settlement.tribe.civilizationLevel * settlement.tribe.civilizationLevel * settlement.tribe.civilizationLevel * (10 + 40 * Math.random()))
			Events.trigger('notification', { type: 'destroyed', settlement, treasure })
		} else {
			Events.trigger('notification', { type: 'decimated', settlement })
		}
	} else {
		Events.trigger('notification', { type: 'combat', attacker, defender, loser: attacker, strength })
		Unit.disband(attacker)
		Units.unassign(defender)
	}
}
