import MapEntity from '../entity/map'
import Time from '../timeline/time'
import Europe from '../entity/europe'
import UnitView from '../view/unit'



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

	return {
		init,
		update,
		finished
	}
}

export default { create }