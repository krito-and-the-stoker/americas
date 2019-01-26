import Record from 'util/record'
import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import ProduceUnit from 'task/produceUnit'
import Time from 'timeline/time'
import Unit from 'entity/unit'
import Util from 'util/util'
import Commander from 'command/commander'
import MoveTo from 'command/moveTo'
import Disband from 'command/disband'
import Binding from 'util/binding'

const UNIT_PRODUCTION_COST = 10
const create = (tribe, coords, owner) => {
	const settlement = {
		mapCoordinates: coords,
		tribe,
		owner,
		production: UNIT_PRODUCTION_COST * Math.random(),
		productivity: 3 * Math.random(),
	}

	Tile.update.settlement(MapEntity.tile(coords), settlement)

	initialize(settlement)

	Record.add('settlement', settlement)
	return settlement
}

const initialize = settlement => {
	if (settlement.destroy) {
		settlement.destroy()
	}

	settlement.destroy = Util.mergeFunctions([
		Time.schedule(ProduceUnit.create(settlement)),
		listen.production(settlement, production => {
			if (production > UNIT_PRODUCTION_COST) {
				const target = Util.choose(
					Record.getAll('settlement')
						.concat(Record.getAll('colony'))
						.filter(t => {
							const distance = Util.distance(t.mapCoordinates, settlement.mapCoordinates)
							return distance > 0 && distance < 10
						}))
				if (target) {
					const unit = Unit.create('native', settlement.mapCoordinates, settlement.owner)
					Commander.scheduleBehind(unit.commander, MoveTo.create(unit, target.mapCoordinates))
					Commander.scheduleBehind(unit.commander, Disband.create(unit))
				}
				settlement.production -= UNIT_PRODUCTION_COST
			}
		})
	])
}

const listen = {
	production: (settlement, fn) => Binding.listen(settlement, 'production', fn)
}

const update = {
	production: (settlement, value) => Binding.update(settlement, 'production', value)
}

const save = settlement => ({
	mapCoordinates: settlement.mapCoordinates,
	tribe: Record.reference(settlement.tribe),
	owner: Record.reference(settlement.owner),
	production: settlement.production,
	productivity: settlement.productivity
})

const load = settlement => {
	settlement.tribe = Record.dereference(settlement.tribe)
	settlement.owner = Record.dereference(settlement.owner)
	Tile.update.settlement(MapEntity.tile(settlement.mapCoordinates), settlement)

	Record.entitiesLoaded(() => initialize(settlement))
	return settlement
}

export default {
	create,
	listen,
	update,
	load,
	save
}