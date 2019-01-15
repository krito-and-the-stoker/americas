import Record from '../util/record'
import Treasure from './treasure'
import Unit from './unit'
import Member from '../util/member'
import Binding from '../util/binding'
import Util from '../util/util'
import Message from '../view/ui/message'

const possibleColonists = [
	{ unit: 'settler', 'name': 'Petty Criminals', expert: "criminal" },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: "criminal" },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: "criminal" },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: "criminal" },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: "criminal" },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: "criminal" },
	{ unit: 'settler', 'name': 'Servants', expert: "servant" },
	{ unit: 'settler', 'name': 'Servants', expert: "servant" },
	{ unit: 'settler', 'name': 'Servants', expert: "servant" },
	{ unit: 'settler', 'name': 'Servants', expert: "servant" },
	{ unit: 'settler', 'name': 'Servants', expert: "servant" },
	{ unit: 'settler', 'name': 'Servants', expert: "servant" },
	{ unit: 'settler', name: "Free Colonist", expert: null },
	{ unit: 'settler', name: "Free Colonist", expert: null },
	{ unit: 'settler', name: "Free Colonist", expert: null },
	{ unit: 'settler', name: "Free Colonist", expert: null },
	{ unit: 'soldier', name: "Veteran Soldier", expert: "soldier" },
	{ unit: 'pioneer', name: "Hardened Pioneer", expert: "pioneer" },
	{ unit: 'scout', name: "Seasoned Scout", expert: "scout" },
	{ unit: 'missionary', name: "Missionary", expert: "missionary" },
	{ unit: 'settler', 'name': 'Expert Farmer', expert: "farmer" },
	{ unit: 'settler', 'name': 'Expert Lumberjack', expert: "lumberjack" },
	{ unit: 'settler', 'name': 'Expert Oreminer', expert: "oreminer" },
	{ unit: 'settler', 'name': 'Expert Silverminer', expert: "silverminer" },
	{ unit: 'settler', 'name': 'Expert Fisher', expert: "fisher" },
	{ unit: 'settler', 'name': 'Master Distiller', expert: "distiller" },
	{ unit: 'settler', 'name': 'Master Tobacconist', expert: "tobacconist" },
	{ unit: 'settler', 'name': 'Master Weaver', expert: "weaver" },
	{ unit: 'settler', 'name': 'Master Furtrader', expert: "furtrader" },
	{ unit: 'settler', 'name': 'Expert Carpenter', expert: "carpenter" },
	{ unit: 'settler', 'name': 'Expert Blacksmith', expert: "blacksmith" },
	{ unit: 'settler', 'name': 'Expert Gunsmith', expert: "gunsmith" },
	{ unit: 'settler', 'name': 'Firebrand Preacher', expert: "preacher" },
	{ unit: 'settler', 'name': 'Elder Statesman', expert: "statesman" },
]

const europe = {
	units: [],
	crosses: 0,
	crossesNeeded: 10,
	pool: [Util.choose(possibleColonists), Util.choose(possibleColonists), Util.choose(possibleColonists)]
}

const add = {
	unit: unit => Member.add(europe, 'units', unit)
}

const remove = {
	unit: unit => Member.remove(europe, 'units', unit)
}

const has = {
	unit: unit => Member.has(europe, 'units', unit)
}

const listen = {
	units: fn => Binding.listen(europe, 'units', fn),
	crosses: fn => Binding.listen(europe, 'crosses', fn),
}

const update = {
	crosses: value => {
		return Binding.update(europe, 'crosses', europe.crosses + value)
	}
}



const save = () => ({
	units: europe.units.map(Record.reference),
	crosses: europe.crosses,
	crossesNeeded: europe.crossesNeeded
})

const load = data => {
	europe.units = data.units.map(Record.dereference)
	europe.crosses = data.crosses
	europe.crossesNeeded = data.crossesNeeded
}

const recruitmentCost = () => Math.round(100 + 500 * Math.max(1 - Math.floor(europe.crosses) / europe.crossesNeeded, 0))

const recruitmentOptions = () => {
	const price = recruitmentCost()
	return Treasure.amount() >= price ?
		europe.pool.map(({ unit, name, expert }) => ({ text: `${name} (${price})`, unit, expert })).concat([{ text: 'No one at the moment.' }]) :
		[{ text: `We cannot afford a new colonist (${price})` }]
}

const recruit = (option, index) => {
	if (option.unit && Treasure.spend(recruitmentCost())) {
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'))
		Unit.update.offTheMap(unit, true)
		Unit.update.expert(unit, option.expert)
		add.unit(unit)
		europe.crossesNeeded += 1
		europe.crosses = 0
		update.crosses(0)
		europe.pool[index] = Util.choose(possibleColonists)
	}
}

const purchaseOptions = () => [
		{ text: 'Artillery (500)', unit: 'artillery', price: 500 },
		{ text: 'Caravel (1000)', unit: 'caravel', price: 1000 },
		{ text: 'Privateer (2000)', unit: 'privateer', price: 2000 },
		{ text: 'Merchantman (2000)', unit: 'merchantman', price: 2000 },
		{ text: 'Galleon (3000)', unit: 'galleon', price: 3000 },
		{ text: 'Frigate (5000)', unit: 'frigate', price: 5000 },
		{ text: 'Nothing at the moment.', price: 0 }
	].filter(option => option.price <= Treasure.amount())

const purchase = option => {
	if (Treasure.spend(option.price) && option.unit) {
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'))
		Unit.update.offTheMap(unit, true)
		add.unit(unit)
	}
}

const initialize = () => {
	listen.crosses(crosses => {
		if (crosses >= europe.crossesNeeded) {
			const index = Math.floor(Math.random() * europe.pool.length)
			const chosen = europe.pool[index]
			europe.pool[index] = Util.choose(possibleColonists)
			const unit = Unit.create(chosen.unit, Record.getGlobal('defaultShipArrival'))
			Unit.update.expert(unit, chosen.expert)
			Unit.update.offTheMap(unit, true)
			add.unit(unit)
			update.crosses(-europe.crossesNeeded)
			europe.crossesNeeded += 1
			Message.send(`Religious unrest in Europe has caused a ${chosen.name} to line up for migration to the new world.`)
		}
	})
	Message.log('Europe initialized')
}


export default {
	add,
	remove,
	has,
	listen,
	update,
	save,
	load,
	recruitmentOptions,
	recruit,
	purchaseOptions,
	purchase,
	initialize
}