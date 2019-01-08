import Record from '../util/record'
import Treasure from './treasure'


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
	units: units.map(Record.reference)
})

const load = data => {
	unitsListeners = []
	units = data.units.map(Record.dereference)
}

const buy = (goods, amount) => {
	const pricePerGood = 6
	const price = pricePerGood * amount
	if (Treasure.spend(price)) {
		console.log(`bought ${amount} ${goods}`)
		return amount
	}
	const actualAmount = Math.floor(Treasure.amount() / pricePerGood)
	Treasure.spend(actualAmount * pricePerGood)
	console.log(`bought ${actualAmount} ${goods}`)
	return actualAmount
}

const sell = (goods, amount) => {
	const pricePerGood = 4
	Treasure.gain(amount * pricePerGood)
	console.log(`sold ${amount} ${goods}`)
}


export default {
	arrive,
	leave,
	hasUnit,
	bindUnits,
	save,
	load,
	buy,
	sell
}