import 'test/normal-setup'

import Time from 'timeline/time'

import Record from 'util/record'
import Unit from 'entity/unit'
import Owner from 'entity/owner'

test('serialize', () => {
  Record.serialize()
})

test('serialize/unserialize', () => {
  const save = Record.serialize()
  Time.advance(0)
  const state1 = Record.state()

  Unit.create('caravel', { x: 0, y: 0 }, Owner.player())

  Record.unserialize(save)
  Time.advance(0)
  const state2 = Record.state()

  expect(state1).toEqual(state2)
})
