import 'test/min-setup'

import Colonist from 'entity/colonist'
import Unit from 'entity/unit'
import Owner from 'entity/owner'


test('create', () => {
	const settler = Unit.create('settler', { x: 1, y: 1 }, Owner.player())
	Colonist.create(settler)
})