import americaLargeMap from 'data/america-large'

import polyfills from 'util/polyfills'

import Unit from 'entity/unit'
import Owner from 'entity/owner'
import MapEntity from 'entity/map'


beforeAll(() => {
	MapEntity.create({ data: americaLargeMap })
	Owner.initialize()
})


test('hello world', () => {
	expect(true).toBe(true)
})

test('create', () => {
	Unit.create('caravel', { x: 0, y: 0 }, Owner.player())
	expect(true).toBe(true)
})