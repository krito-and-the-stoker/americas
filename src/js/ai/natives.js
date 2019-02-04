import 'util/polyfills'

import Util from 'util/util'
import Binding from 'util/binding'
import Member from 'util/member'
import Record from 'util/record'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'


const initialize = ai => {
	Util.execute(ai.destroy)

	return [
		listen.settlements(ai, settlements => {
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
		})
	]
}

const create = owner => {
	const ai = {
		settlements: [],
		owner,
		hasMetPlayer: false
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
	hasMetPlayer: ai.hasMetPlayer,
	owner: Record.reference(ai.owner)
})

const add = {
	settlement: (ai, settlement) => Member.add(ai, 'settlements', settlement)
}

const listen = {
	settlements: (ai, fn) => Binding.listen(ai, 'settlements', fn)
}

export default {
	create,
	add,
	load,
	save
}