import seed from 'seed-random'
import testMap from 'data/testmap'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'

beforeAll(() => {
	seed('1234', { global: true })
	MapEntity.create({ data: testMap })
	Owner.initialize()
})