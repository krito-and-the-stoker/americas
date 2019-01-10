import Record from '../util/record'
import Treasure from './treasure'
import Unit from './unit'
import Member from '../util/member'
import Binding from '../util/binding'

const europe = {
	units: []
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
	units: fn => Binding.listen(europe, 'units', fn)
}



const save = () => ({
	units: europe.units.map(Record.reference),
	currentPrice
})

const load = data => {
	europe.units = data.units.map(Record.dereference)
	currentPrice = data.currentPrice
}

let currentPrice = 200
const recruitmentOptions = () => Treasure.amount() >= currentPrice ?
	[{ text: `Settler (${currentPrice})`, unit: 'settler' }, { text: 'None at the moment.' }] :
	[{ text: `We cannot afford a new colonist (${currentPrice})` }]

const recruit = option => {
	if (option.unit && Treasure.spend(currentPrice)) {
		const unit = Unit.create(option.unit)
		add.unit(unit)
		currentPrice += 100
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
		const unit = Unit.create(option.unit, Record.getGlobal('defaultShipArrival'), { active: false })
		add.unit(unit)
	}
}

export default {
	add,
	remove,
	has,
	listen,
	save,
	load,
	recruitmentOptions,
	recruit,
	purchaseOptions,
	purchase
}