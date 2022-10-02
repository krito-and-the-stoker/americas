import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Unit from 'entity/unit'
import Storage from 'entity/storage'
import Colony from 'entity/colony'

const relativeRaidAmont = () => 0.25 + 0.5 * Math.random()

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

	if(0.5 * raider.radius < defender.radius) {
		return false
	}

	Unit.update.radius(raider, 0)
	Unit.update.radius(defender, 0)

	const strength = {
		attacker: Unit.strength(raider),
		defender: Unit.strength(defender),
	}

	const probability = {
		raider: Math.pow(strength.attacker, 2),
		defender: Math.pow(strength.defender, 2),
	}

	const chance = Math.random() * (probability.raider + probability.defender)

	const raiderName = Unit.name(raider)
	const defenderName = Unit.name(defender)

	if (chance < probability.raider) {
		const survivalChance = (1 - (1 / (colony.buildings.fortifications.level + 1))) + (1 / colony.colonists.length)
		if (Math.random() < survivalChance) {
			Message.send(`A ${raiderName} overcame the defenders of ${colony.name}. The storage has been plundered. A ${defenderName} has barely survvived the attack. The colonists in fear.`)
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

		const pack = Util.choose(Storage.goods(colony.storage).filter(p => p.amount >= 1))
		pack.amount = Util.clamp(relativeRaidAmont() * pack.amount, 1, 50)
		Storage.transfer(colony.storage, raider.equipment, pack)
		Events.trigger('notification', { type: 'raid', colony, unit: raider, pack })
	} else {
		const plunderChance = 0.5 / (colony.buildings.fortifications.level + 1)
		if (Math.random() < plunderChance) {
			Message.send(`A ${raiderName} could not overcome the defenders of ${colony.name}. However, massive amounts of goods are missing after the attack. The colonists are outraged.`)

			const pack = Util.choose(Storage.goods(colony.storage).filter(p => p.amount >= 1))
			pack.amount = Util.clamp(relativeRaidAmont() * pack.amount, 1, 50)
			Storage.transfer(colony.storage, raider.equipment, pack)
			Events.trigger('notification', { type: 'raid', colony, unit: raider, pack })
		} else {
			Message.send(`A ${raiderName} has been killed in the attempt to attack ${colony.name}.`)
			Events.trigger('notification', { type: 'combat', attacker: raider, defender, loser: raider, strength })
			Unit.disband(raider)
		}
	}
}