import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Unit from 'entity/unit'
import Storage from 'entity/storage'
import Colony from 'entity/colony'

const relativeRaidAmont = () => 0.25 + 0.6 * Math.random()

export default (colony, raider) => {
	// TODO: find a more reasonable solution
	if (Util.sum(Storage.goods(raider.equipment)
		.filter(pack => pack.good !== 'guns' && pack.good !== 'horses')
		.map(pack => pack.amount)) > 0) {
		return false
	}

	if (!Util.inBattleDistance(raider, colony)) {
		return false
	}

	const possibleDefenders = colony.units
		.filter(unit => unit.owner === colony.owner)
		.filter(unit => unit.domain === 'land')
	const possibleDefender = Util.max(possibleDefenders, unit => Unit.strength(unit))
	const defender = Unit.strength(possibleDefender) > Unit.strength(Colony.defender(colony))
		? possibleDefender
		: Colony.defender(colony)

	if (0.5 * raider.radius < defender.radius) {
		return false
	}

	// sometimes a defender dies
	if (!defender.properties.combat) {	
		const raiderName = Unit.name(raider)
		const defenderName = Unit.name(defender)
		const strength = {
			attacker: Unit.strength(raider),
			defender: Unit.strength(defender),
		}
		const survivalChance = (1 - (1 / (colony.buildings.fortifications.level + 1))) + (1 / colony.colonists.length)
		if (Math.random() < survivalChance) {
			Message.send(`A ${raiderName} overcame the defenders of ${colony.name}. The storage has been plundered. A ${defenderName} has barely survived the attack. The colonists in fear.`)
		} else {
			Message.send(`A ${raiderName} overcame the defenders of ${colony.name}. The storage has been plundered. A ${defenderName} has died in an attempt to defend. The colonists seek revenge.`)
			Events.trigger('notification', { type: 'combat', attacker: raider, defender, loser: defender, strength })

			if (defender.properties.defeated) {
				if (defender.properties.defeated.transfer) {
					defender.properties.defeated.transfer.forEach(good => {
						Storage.transfer(defender.equipment, raider.equipment, { good })
					})
				}
			}
			if (!defender.properties.defeated) {
				Unit.disband(defender)
			}
		}
	}

	// the raiding happens here
	const fortificationLevel = colony.buildings.fortifications?.level || 0
	const pack = Util.choose(Storage.goods(colony.storage).filter(p => p.amount >= 1))
	pack.amount = Util.clamp(relativeRaidAmont() * pack.amount, 1, (4 - fortificationLevel) * 100)
	Storage.transfer(colony.storage, raider.equipment, pack)
	Events.trigger('notification', { type: 'raid', colony, unit: raider, pack })
}