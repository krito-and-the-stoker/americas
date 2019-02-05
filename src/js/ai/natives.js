import 'util/polyfills'

import Util from 'util/util'
import Binding from 'util/binding'
// import Member from 'util/member'
import Record from 'util/record'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Tribe from 'entity/tribe'


const initialize = ai => {
	Util.execute(ai.destroy)

	return [
		listen.tribe(ai, tribe =>
			tribe ? Tribe.listen.settlements(tribe, settlements => {
				const tiles = settlements
					.map(settlement => Util.quantizedRadius(settlement.mapCoordinates, 5))
					.flat()
					.map(coords => MapEntity.tile(coords))
					.filter(Util.unique)
				return tiles.map(tile =>
					Tile.listen.units(tile, units => {
						units
							.filter(unit => unit.domain !== 'sea')
							.forEach(unit =>
								console.log('unit in range', unit))
					}))
			}) : null)
	]
}

const create = owner => {
	const ai = {
		owner,
		tribe: null,
	}

	ai.destroy = initialize(ai)

	return ai
}

const load = ai => {
	ai.settlements = []
	Record.dereferenceLazy(ai.owner, owner => { ai.owner = owner })
	Record.entitiesLoaded(() => {
		initialize(ai)
	})

	return ai
}

const save = ai => ({
	owner: Record.reference(ai.owner)
})

const listen = {
	tribe: (ai, fn) => Binding.listen(ai, 'tribe', fn)
}

const update = {
	tribe: (ai, value) => Binding.update(ai, 'tribe', value)
}

export default {
	create,
	update,
	listen,
	load,
	save
}