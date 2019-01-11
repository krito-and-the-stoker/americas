import Record from '../util/record'
import Treasure from './treasure'
import Unit from './unit'
import Member from '../util/member'
import Binding from '../util/binding'
import Util from '../util/util'
import Message from '../view/ui/message'

const possibleColonists = ['settler', 'soldier', 'pioneer', 'scout']

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
		europe.pool.map(unit => ({ text: `${unit} (${price})`, unit })).concat([{ text: 'No one at the moment.' }]) :
		[{ text: `We cannot afford a new colonist (${price})` }]
}

const recruit = option => {
	if (option.unit && Treasure.spend(recruitmentCost())) {
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'))
		Unit.update.offTheMap(unit, true)
		add.unit(unit)
		europe.crossesNeeded += 1
		europe.crosses = 0
		update.crosses(0)
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
	console.log('initialized europe')
	listen.crosses(crosses => {
		if (crosses > europe.crossesNeeded) {
			const type = Util.choose(europe.pool)
			europe.pool[europe.pool.indexOf(type)] = Util.choose(possibleColonists)
			const unit = Unit.create(type, Record.getGlobal('defaultShipArrival'))
			Unit.update.offTheMap(unit, true)
			add.unit(unit)
			europe.crossesNeeded += 1
			europe.crosses = 0
			Message.send(`Religious unrest in Europe has caused a ${type} to line up for migration to the new world.`)
		}
	})
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