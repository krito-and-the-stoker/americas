import Record from 'util/record'
import Time from 'timeline/time'


const initialize = carpenters => {
	const carpenters.destroy = [
	]
}

const create = colony => {
	const carpenters = {
		name: 'carpenters',
		level: 1,
		display: 'Carpenters house',
		position: null && colony // <- TODO: use the colony to find a suitable position
		workers: [],
		target: null,
		queue: [],
	}

 initalize(carpenters)

 return carpenters
}

const save = carpenters => {
	return carpenters
}

const load = data => {
  Record.entitiesLoaded(() => initialize(data))
	return data
}

export default {
	create, save, load
}
