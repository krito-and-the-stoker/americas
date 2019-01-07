import Record from '../util/record'


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
	units = data.units.map(Record.dereference)
}

const buy = (goods, amount) => {
	console.log(`bought ${amount} ${goods}`)
}

const sell = (goods, amount) => {
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