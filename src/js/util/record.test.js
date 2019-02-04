import 'test/normal-setup'

import Record from 'util/record'
import Binding from 'util/binding'
import Unit from 'entity/unit'
import Owner from 'entity/owner'

test('serialize', () => {
	Record.serialize()
})

test('serialize/unserialize', () => {
	const save = Record.serialize()
	Binding.applyAllUpdates()
	const state1 = Record.state()
	Unit.create('caravel', { x: 0, y: 0 }, Owner.player())
	Record.unserialize(save)
	Binding.applyAllUpdates()
	const state2 = Record.state()
	expect(state1).toEqual(state2)
})