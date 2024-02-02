import 'test/min-setup'

import Colony from 'entity/colony'
import Owner from 'entity/owner'

test('create', () => {
	Colony.create({ x: 1, y: 1 }, Owner.player())
})