import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Unit from 'entity/unit'
import Storage from 'entity/storage'

export default (colony, raider) => {
	const possibleDefenders = colony.units
		.filter(unit => unit.owner === colony.owner)
		.filter(unit => unit.domain === 'land')
	const defender = Util.max(possibleDefenders, unit => Unit.strength(unit))

	Unit.update.radius(raider, 0)

	let probability = {
		raider: Math.pow(Unit.strength(raider), 2),
		defender: Math.pow(Unit.strength(defender), 2),
	}

	const chance = Math.random() * (probability.raider + probability.defender)

	const raiderName = Unit.name(raider)
	const defenderName = Unit.name(defender)

	console.log('raid', chance, probability)

	if (chance < probability.raider) {
		const survivalChance = (1 - (1 / (colony.buildings.fortifications.level + 1))) + (1 / colony.colonists.length)
		if (Math.random() < survivalChance) {
			Message.send(`A ${raiderName} overcame the defenders of ${colony.name}. The storage has been plundered. A ${defenderName} has barely survvived the attack. The colonists in fear.`)
			Events.trigger('notification', { type: 'raid', colony, unit: raider })
		} else {
			Message.send(`A ${raiderName} overcame the defenders of ${colony.name}. The storage has been plundered. A ${defenderName} has died in an attempt to defend. The colonists seek revenge.`)
			Events.trigger('notification', { type: 'combat', attacker: raider, defender, loser: defender })
			Unit.disband(defender)
		}

		Storage.goods(colony.storage).forEach(pack => {
			pack.amount *= Math.random()
			Storage.transfer(colony.storage, raider.equipment, pack)
		})
	} else {
		const plunderChance = 0.5 / (colony.buildings.fortifications.level + 1)
		if (Math.random() < plunderChance) {
			Message.send(`A ${raiderName} could not overcome the defenders of ${colony.name}. However, massive amounts of goods are missing after the attack. The colonists are outraged.`)
			Storage.goods(colony.storage).forEach(pack => {
				pack.amount *= plunderChance * Math.random()
				Storage.transfer(colony.storage, raider.equipment, pack)
			})
			Events.trigger('notification', { type: 'raid', colony, unit: raider })
		} else {
			Message.send(`A ${raiderName} has been killed in the attempt to attack ${colony.name}.`)
			Events.trigger('notification', { type: 'combat', attacker: raider, defender, loser: raider })
			Unit.disband(raider)
		}
	}
}