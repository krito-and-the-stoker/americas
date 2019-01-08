import Dialog from '../view/dialog'
import UnitView from '../view/unit'
import Time from '../timeline/time'
import Move from './move'
import Commander from './commander'
import Record from '../util/record'
import Unit from '../entity/unit'


const create = (unit, cargoUnit, loadingStartedAt = null) => {
	const init = currentTime => {
		if (!loadingStartedAt) {		
			loadingStartedAt = currentTime
		}

		return true
	}

	const update = currentTime => {
		return currentTime < loadingStartedAt + Time.LOAD_TIME
	}

	const finished = () => {
		Unit.loadUnit(unit, cargoUnit)
	}

	const save = () => ({
		type: 'load',
		loadingStartedAt,
		unit: Record.reference(unit),
		cargoUnit: Record.reference(cargoUnit)
	})

	return {
		type: 'load',
		init,
		update,
		finished,
		save
	}
}

const load = data => {
	const unit = Record.dereference(data.unit)
	const cargoUnit = Record.dereference(data.cargoUnit)
	return create(unit, cargoUnit, data.loadingStartedAt)
}

export default {
	create,
	load
}