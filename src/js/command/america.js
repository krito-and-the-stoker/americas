import MapEntity from '../entity/map'
import Time from '../timeline/time'
import Europe from '../entity/europe'
import UnitView from '../view/unit'
import Record from '../util/record'


const create = (unit, eta = null) => {
	const init = currentTime => {
		if (!Europe.hasUnit(unit)) {
			return false
		}

		if (!eta) {		
			Europe.leave(unit)
			eta = currentTime + Time.EUROPE_SAIL_TIME
		}

		return true
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			UnitView.activate(unit)
		}
	}

	const save = () => ({
		type: 'america',
		eta,
		unit: Record.reference(unit)
	})

	return {
		init,
		update,
		finished,
		save
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	return create(unit, data.eta)
}

export default {
	create,
	load
}