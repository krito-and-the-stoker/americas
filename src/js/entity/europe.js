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
	[{ text: `Oh we cannot afford to recruit a new colonist (${currentPrice})` }]

const recruit = option => {
	if (option.unit && Treasure.spend(currentPrice)) {
		const unit = Unit.create(option.unit)
		arrive(unit)
		currentPrice += 100
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
	recruit
}