import 'test/min-setup'

import Record from 'util/record'
import Owner from 'entity/owner'
import Unit from 'entity/unit'

test('serialize', () => {
	Record.serialize()
})

test('serialize/unserialize', () => {
	const save1 = Record.serialize()
	Unit.create('caravel', {x: 0, y: 0 }, Owner.player())
	const save2 = Record.serialize()
	Record.unserialize(save1)
	const save3 = Record.serialize()
	expect(save1).not.toEqual(save2)
	expect(save1).toEqual(save3)
})