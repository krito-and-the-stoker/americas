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

	let colonies = []
	Record.listen('colony', colony => {
		colonies.push(colony)
		return () => {
			colonies = colonies.filter(c => c !== colony)
		}
	})

	const update = () => {
		units.forEach(unit => 
			units.filter(other => other.owner !== unit.owner
					&& !unit.disbanded
					&& !other.disbanded
					&& Util.inDistance(unit, other))
				.forEach(other => {
					Events.trigger('meet', { unit, other })
				}))
		units.forEach(unit =>
			colonies.filter(colony => unit.owner !== colony.owner)
				.forEach(colony => {
					if (Util.inDistance(unit, colony)) {
						Events.trigger('meet', { unit, colony })
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