import Record from '../util/record'
import Treasure from './treasure'
import Unit from './unit'


let units = []
let unitsListeners = []
const arrive = unit => {
	console.log('arrived in europe', unit)
	units.push(unit)
	unitsListeners.forEach(fn => fn(units))
}

const leave = unit => {
	units = units.filter(u => u !== unit)
	unitsListeners.forEach(fn => fn(units))
}

const hasUnit = unit => units.includes(unit)

const bindUnits = fn => {
	fn(units)
	unitsListeners.push(fn)

	const remove = () => {
		unitsListeners = unitsListeners.filter(f => f !== fn)
	}

	return remove
}

const save = () => ({
	units: units.map(Record.reference),
	currentPrice
})

const load = data => {
	unitsListeners = []
	units = data.units.map(Record.dereference)
	currentPrice = data.currentPrice
}

let currentPrice = 200
const recruitmentOptions = () => Treasure.amount() >= currentPrice ?
	[{ text: `Settler (${currentPrice})`, unit: 'settler' }, { text: 'None at the moment.' }] :
	[{ text: `We cannot afford a new colonist (${currentPrice})` }]

const recruit = option => {
	if (option.unit && Treasure.spend(currentPrice)) {
		const unit = Unit.create(option.unit)
		arrive(unit)
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
		arrive(unit)
	}
}

export default {
	arrive,
	leave,
	hasUnit,
	bindUnits,
	save,
	load,
	recruitmentOptions,
	recruit,
	purchaseOptions,
	purchase
}