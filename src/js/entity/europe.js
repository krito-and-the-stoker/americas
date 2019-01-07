import Record from '../util/record'


let units = []
let unitsListeners = []
const arrive = unit => {
	console.log('arrived in europe', unit)
	units.push(unit)
	unitsListeners.forEach(fn => fn(units))
}

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


export default {
	arrive,
	bindUnits,
	save,
	load
}