import 'test/setup'

import Settlement from 'entity/settlement'
import Owner from 'entity/owner'
import Tribe from 'entity/tribe'

test('create', () => {
	const owner = Owner.create('natives')
	const tribe = Tribe.create(1, owner)
	Settlement.create(tribe, { x: 74, y: 36 }, owner)
})