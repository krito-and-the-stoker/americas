import 'test/min-setup'

import Settlement from 'entity/settlement'
import Owner from 'entity/owner'
import Tribe from 'entity/tribe'

test('create', () => {
	const owner = Owner.create('natives')
	const tribe = Tribe.create(1, owner)
	Settlement.create(tribe, { x: 1, y: 1 }, owner)
})