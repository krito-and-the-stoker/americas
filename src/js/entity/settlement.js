import Record from '../util/record'
import Tile from '../entity/tile'
import MapEntity from '../entity/map'

const create = (tribe, coords) => {
	const settlement = {
		mapCoordinates: coords,
		tribe
	}

	Tile.update.settlement(MapEntity.tile(coords), settlement)

	Record.add('settlement', settlement)
	return settlement
}

const save = settlement => ({
	mapCoordinates: settlement.mapCoordinates,
	tribe: Record.reference(settlement.tribe)
})

const load = settlement => {
	settlement.tribe = Record.dereference(settlement.tribe)
	return settlement
}

export default {
	create,
	load,
	save
}