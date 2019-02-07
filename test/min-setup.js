import seed from 'seed-random'
import testMap from 'data/testmap'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'
import Market from 'entity/market'

beforeAll(() => {
	seed('1234', { global: true })
	MapEntity.create({ data: testMap })
	Market.initialize()
	Owner.initialize()
})