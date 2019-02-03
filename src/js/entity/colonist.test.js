import 'test/setup'

import Colonist from 'entity/colonist'
import Unit from 'entity/unit'
import Owner from 'entity/owner'


test('create', () => {
	const settler = Unit.create('settler', { x: 74, y: 36 }, Owner.player())
	Colonist.create(settler)
})