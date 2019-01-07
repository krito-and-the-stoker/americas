import MapEntity from '../entity/map'
import Time from '../timeline/time'
import Europe from '../entity/europe'
import UnitView from '../view/unit'
import Record from '../util/record'


const createWithEta = (unit, eta) => {
	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Europe.arrive(unit)
		}
	}

	const save = () => ({
		type: 'europe',
		eta,
		unit: Record.reference(unit)
	})

	return {
		update,
		finished,
		save
	}	
}


const create = unit => {

	let eta = null
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (tile.name !== 'sea lane') {
			return false
		}

		UnitView.deactivate(unit)
		eta = currentTime + Time.EUROPE_SAIL_TIME

		return true
	}

	const update = currentTime => eta > currentTime

	const finished = () => {
		if (eta) {
			Europe.arrive(unit)
		}
	}

	const save = () => ({
		type: 'europe',
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
	if (data.eta) {
		return createWithEta(unit, data.eta)
	} else {
		return create(unit)
	}
}

export default {
	create,
	load
}