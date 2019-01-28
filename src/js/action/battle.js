import Unit from 'entity/unit'
import Time from 'timeline/time'
import Record from 'util/record'
import Util from 'util/util'

export default (attacker, other) => {
	console.log('attacking', other)
	const defender = Record.getAll('unit')
		.filter(unit => unit.owner === other.owner)
		.filter(unit => Util.inBattleDistance(unit, attacker))
		.reduce((best, unit) => Unit.strength(best) < Unit.strength(unit) ? unit : best, other)

	console.log('defended by', defender)
	let probability = {
		attacker: Math.pow(Unit.strength(attacker), 2),
		defender: Math.pow(Unit.strength(defender), 2),
	}

	const chance = Math.random() * (probability.attacker + probability.defender)
	console.log('attacker', attacker, Unit.strength(attacker), probability.attacker)
	console.log('defender', defender, Unit.strength(defender), probability.defender)
	Unit.remove.hostile(attacker, defender)
	if (chance < probability.attacker) {
		console.log('battle won by attacker')
		Time.schedule({ init: () => Unit.disband(defender), priority: true })
		Unit.update.radius(attacker, 0)
	} else {
		console.log('battle won by defender')
		Time.schedule({ init: () => Unit.disband(attacker), priority: true })
		Unit.update.radius(defender, 0)
	}
}