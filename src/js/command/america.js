import MapEntity from '../entity/map'
import Time from '../timeline/time'
import Europe from '../entity/europe'
import UnitView from '../view/unit'
import Record from '../util/record'
import Unit from '../entity/unit'


const create = (unit, eta = null) => {
	const init = currentTime => {
		if (!Europe.hasUnit(unit)) {
			return false
		}

		if (!eta) {
			eta = currentTime + Time.EUROPE_SAIL_TIME
			Europe.remove.unit(unit)
		}

		return true
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Unit.update.offTheMap(unit, false)
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