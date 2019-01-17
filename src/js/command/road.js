import Time from '../timeline/time'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Unit from '../entity/unit'
import Record from '../util/record'
import Storage from '../entity/storage'
import Notification from '../view/ui/notification'

const create = (unit, eta) => {
	let aborted = false
	const init = currentTime => {
		const tile = MapEntity.tile(unit.mapCoordinates)
		if (!eta && unit.properties.canTerraform && !tile.road && !tile.settlement) {
			eta = currentTime + Time.CONSTRUCT_ROAD * (unit.expert === 'pioneer' ? 0.6 : 1)
		}

		if (eta) {
			Unit.update.pioneering(unit, true)
			return true
		}

		aborted = true
		return false
	}

	const update = currentTime => currentTime < eta
	const finished = () => {
		if (!aborted) {
			Storage.update(unit.equipment, { good: 'tools', amount: -20 })	
			Tile.constructRoad(MapEntity.tile(unit.mapCoordinates))
			Unit.update.pioneering(unit, false)
			Notification.create({ type: 'terraforming', unit })
		}
	}

	const save = () => ({
		type: 'road',
		unit: Record.reference(unit),
		eta
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