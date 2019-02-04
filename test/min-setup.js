import testMap from 'data/testmap'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'

beforeAll(() => {
	MapEntity.create({ data: testMap })
	Owner.initialize()
})