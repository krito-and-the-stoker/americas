import 'test/setup'

import Colony from 'entity/colony'
import Owner from 'entity/owner'

test('create', () => {
	Colony.create({ x: 74, y: 36 }, Owner.player())
})