import Unit from 'entity/unit'
import Time from 'timeline/time'

export default (attacker, defender) => {
	let probability = {
		attacker: Math.pow(Unit.strength(attacker), 2),
		defender: Math.pow(Unit.strength(defender), 2),
	}

	const chance = Math.random() * (probability.attacker + probability.defender)
	console.log('attacker', attacker, Unit.strength(attacker), probability.attacker)
	console.log('defender', defender, Unit.strength(defender), probability.defender)
	if (chance < probability.attacker) {
		console.log('battle won by attacker')
		Time.schedule({ init: () => Unit.disband(defender) })
		Unit.remove.hostile(attacker, defender)
		Unit.update.radius(attacker, 0)
	} else {
		console.log('battle won by defender')
		Time.schedule({ init: () => Unit.disband(attacker) })
		Unit.update.radius(defender, 0)
	}
}