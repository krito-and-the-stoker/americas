import Record from 'util/record'
import Member from 'util/member'
import Binding from 'util/binding'
import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Unit from 'entity/unit'
import Treasure from 'entity/treasure'
import Owner from 'entity/owner'
import Trade from 'entity/trade'


const possibleColonists = [
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', name: 'Free Colonist', expert: null },	
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Petty Criminals', expert: 'criminal' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', 'name': 'Servants', expert: 'servant' },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', name: 'Free Colonist', expert: null },
	{ unit: 'settler', 'name': 'Expert Farmer', expert: 'farmer' },
	{ unit: 'settler', 'name': 'Expert Lumberjack', expert: 'lumberjack' },
	{ unit: 'settler', 'name': 'Expert Oreminer', expert: 'oreminer' },
	{ unit: 'settler', 'name': 'Expert Silverminer', expert: 'silverminer' },
	{ unit: 'settler', 'name': 'Expert Fisher', expert: 'fisher' },
	{ unit: 'settler', 'name': 'Expert Farmer', expert: 'farmer' },
	{ unit: 'settler', 'name': 'Expert Lumberjack', expert: 'lumberjack' },
	{ unit: 'settler', 'name': 'Expert Oreminer', expert: 'oreminer' },
	{ unit: 'settler', 'name': 'Expert Silverminer', expert: 'silverminer' },
	{ unit: 'settler', 'name': 'Expert Fisher', expert: 'fisher' },
	{ unit: 'settler', 'name': 'Expert Farmer', expert: 'farmer' },
	{ unit: 'settler', 'name': 'Expert Lumberjack', expert: 'lumberjack' },
	{ unit: 'settler', 'name': 'Expert Oreminer', expert: 'oreminer' },
	{ unit: 'settler', 'name': 'Expert Silverminer', expert: 'silverminer' },
	{ unit: 'settler', 'name': 'Expert Fisher', expert: 'fisher' },
	{ unit: 'settler', 'name': 'Expert Farmer', expert: 'farmer' },
	{ unit: 'settler', 'name': 'Expert Lumberjack', expert: 'lumberjack' },
	{ unit: 'settler', 'name': 'Expert Oreminer', expert: 'oreminer' },
	{ unit: 'settler', 'name': 'Expert Silverminer', expert: 'silverminer' },
	{ unit: 'settler', 'name': 'Expert Fisher', expert: 'fisher' },
	{ unit: 'pioneer', name: 'Hardened Pioneer', expert: 'pioneer' },
	{ unit: 'scout', name: 'Seasoned Scout', expert: 'scout' },
	{ unit: 'soldier', name: 'Veteran Soldier', expert: 'soldier' },
	{ unit: 'pioneer', name: 'Hardened Pioneer', expert: 'pioneer' },
	{ unit: 'scout', name: 'Seasoned Scout', expert: 'scout' },
	{ unit: 'soldier', name: 'Veteran Soldier', expert: 'soldier' },
	{ unit: 'settler', 'name': 'Master Distiller', expert: 'distiller' },
	{ unit: 'settler', 'name': 'Master Tobacconist', expert: 'tobacconist' },
	{ unit: 'settler', 'name': 'Master Weaver', expert: 'weaver' },
	{ unit: 'settler', 'name': 'Master Furtrader', expert: 'furtrader' },
	{ unit: 'settler', 'name': 'Expert Carpenter', expert: 'carpenter' },
	{ unit: 'settler', 'name': 'Expert Blacksmith', expert: 'blacksmith' },
	{ unit: 'settler', 'name': 'Expert Gunsmith', expert: 'gunsmith' },
	{ unit: 'missionary', name: 'Jesuit Missionary', expert: 'missionary' },
	{ unit: 'settler', 'name': 'Firebrand Preacher', expert: 'preacher' },
	{ unit: 'settler', 'name': 'Elder Statesman', expert: 'statesman' },
]

const TRAINING_PRICE_FACTOR = 3
const possibleTrainees = [
	{ unit: 'settler', 'name': 'Expert Oreminer', expert: 'oreminer', price: TRAINING_PRICE_FACTOR * 600 },
	{ unit: 'settler', 'name': 'Expert Lumberjack', expert: 'lumberjack', price: TRAINING_PRICE_FACTOR * 700 },
	{ unit: 'settler', 'name': 'Expert Gunsmith', expert: 'gunsmith', price: TRAINING_PRICE_FACTOR * 850 },
	{ unit: 'settler', 'name': 'Expert Silverminer', expert: 'silverminer', price: TRAINING_PRICE_FACTOR * 900 },
	{ unit: 'settler', 'name': 'Master Furtrader', expert: 'furtrader', price: TRAINING_PRICE_FACTOR * 950 },
	{ unit: 'settler', 'name': 'Expert Carpenter', expert: 'carpenter', price: TRAINING_PRICE_FACTOR * 1000 },
	{ unit: 'settler', 'name': 'Expert Fisher', expert: 'fisher', price: TRAINING_PRICE_FACTOR * 1000 },
	{ unit: 'settler', 'name': 'Expert Blacksmith', expert: 'blacksmith', price: TRAINING_PRICE_FACTOR * 1050 },
	{ unit: 'settler', 'name': 'Expert Farmer', expert: 'farmer', price: TRAINING_PRICE_FACTOR * 1100 },
	{ unit: 'settler', 'name': 'Master Distiller', expert: 'distiller', price: TRAINING_PRICE_FACTOR * 1100 },
	{ unit: 'pioneer', name: 'Hardened Pioneer', expert: 'pioneer', price: TRAINING_PRICE_FACTOR * 1200 },
	{ unit: 'settler', 'name': 'Master Tobacconist', expert: 'tobacconist', price: TRAINING_PRICE_FACTOR * 1200 },
	{ unit: 'settler', 'name': 'Master Weaver', expert: 'weaver', price: TRAINING_PRICE_FACTOR * 1300 },
	{ unit: 'missionary', name: 'Jesuit Missionary', expert: 'missionary', price: TRAINING_PRICE_FACTOR * 1400 },
	{ unit: 'settler', 'name': 'Firebrand Preacher', expert: 'preacher', price: TRAINING_PRICE_FACTOR * 1500 },
	{ unit: 'settler', 'name': 'Elder Statesman', expert: 'statesman', price: TRAINING_PRICE_FACTOR * 1900 },
	{ unit: 'soldier', name: 'Veteran Soldiers', expert: 'soldier', price: TRAINING_PRICE_FACTOR * 2000 },
]

const europe = {
	units: [],
	crosses: 0,
	crossesNeeded: 2,
	pool: [Util.choose(possibleColonists), Util.choose(possibleColonists), Util.choose(possibleColonists)],
	trade: Trade.create()
}

const add = {
	unit: unit => Member.add(europe, 'units', unit)
}

const remove = {
	unit: unit => Member.remove(europe, 'units', unit)
}

const listenEach = {
	units: fn => Member.listenEach(europe, 'units', fn)
}

const has = {
	unit: unit => Member.has(europe, 'units', unit)
}

const listen = {
	units: fn => Binding.listen(europe, 'units', fn),
	crosses: fn => Binding.listen(europe, 'crosses', fn),
	trade: fn => Binding.listen(europe, 'trade', fn),
}

const update = {
	crosses: value => Binding.update(europe, 'crosses', europe.crosses + value),
	trade: () => Binding.update(europe, 'trade')
}



const save = () => ({
	units: europe.units.map(Record.reference),
	crosses: europe.crosses,
	crossesNeeded: europe.crossesNeeded,
	pool: europe.pool,
	trade: Trade.save(europe.trade)
})

const load = data => {
	europe.units = data.units.map(Record.dereference)
	europe.crosses = data.crosses
	europe.crossesNeeded = data.crossesNeeded
	europe.pool = data.pool
	europe.trade = Trade.load(data.trade)
}

const trade = () => europe.trade

const recruitmentCost = () => Math.round(100 + 500 * Math.max(1 - Math.floor(europe.crosses) / europe.crossesNeeded, 0))

const recruitmentOptions = () => europe.pool.map(({ unit, name, expert }, index) => ({
	text: `${name} (${recruitmentCost()})`,
	disabled: recruitmentCost() > Treasure.amount(),
	action: () => recruit({ unit, expert }, index)
})).concat([{
	text: 'No one at the moment.',
	margin: true
}])

const recruit = (option, index) => {
	if (option.unit && Treasure.spend(recruitmentCost())) {
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'), Owner.player())
		Unit.update.offTheMap(unit, true)
		Unit.update.expert(unit, option.expert)
		add.unit(unit)
		europe.crossesNeeded += 1
		europe.crosses = 0
		update.crosses(0)
		europe.pool[index] = Util.choose(possibleColonists)
		Events.trigger('immigration')
	}
}

const purchaseOptions = () => [
	{ text: 'Artillery ({price})', unit: 'artillery', price: 1000 },
	{ text: 'Caravel ({price})', unit: 'caravel', price: 2000 },
	{ text: 'Merchantman ({price})', unit: 'merchantman', price: 5000 },
	{ text: 'Privateer ({price})', unit: 'privateer', price: 7000 },
	{ text: 'Galleon ({price})', unit: 'galleon', price: 10000 },
	{ text: 'Frigate ({price})', unit: 'frigate', price: 15000 },
	{ text: 'Nothing at the moment.', margin: true, price: 0 }
].map(option => ({
	...option,
	text: option.text.replace(/\{price\}/g, option.price),
	disabled: Treasure.amount() < option.price,
	action: () => purchase(option)
}))

const purchase = option => {
	if (Treasure.spend(option.price) && option.unit) {
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'), Owner.player())
		Unit.update.offTheMap(unit, true)
		add.unit(unit)
	}
}

const trainOptions = () => possibleTrainees
	.map(({ unit, name, expert, price }) => ({
		text: `${name} (${price})`,
		disabled: Treasure.amount() < price,
		action: () => train({ unit, expert, price })
	}))
	.concat({
		text: 'Nothing at the moment.',
		margin: true
	})

const train = option => {
	if (Treasure.spend(option.price) && option.unit) {
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'), Owner.player())
		Unit.update.expert(unit, option.expert)
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
			const unit = Unit.create(chosen.unit, Record.getGlobal('defaultShipArrival'), Owner.player())
			Unit.update.expert(unit, chosen.expert)
			Unit.update.offTheMap(unit, true)
			add.unit(unit)
			update.crosses(-europe.crossesNeeded)
			europe.crossesNeeded += 10
			Events.trigger('notification', { type: 'immigration', unit })
			Events.trigger('immigration')
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
	listenEach,
	update,
	save,
	load,
	trade,
	recruitmentOptions,
	recruit,
	purchaseOptions,
	purchase,
	trainOptions,
	train,
	initialize
}