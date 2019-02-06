import Util from 'util/util'
import Record from 'util/record'
import Events from 'util/events'


const create = () => {
	let units = []
	Record.listen('unit', unit => {
		units.push(unit)
		return () => {
			units = units.filter(u => u !== unit)
		}
	})

	const update = () => {
		units.forEach(unit => units
			.filter(other => other.owner !== unit.owner)
			.forEach(other => {
				if (Util.inDistance(unit, other)) {
					Events.trigger('meet', { unit, other })
				}
			}))

		return true
	}

	return {
		update,
		priority: true
	}
}


export default {
	create,
}