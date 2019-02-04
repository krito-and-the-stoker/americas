import americaSmallMap from 'data/america-small'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'

beforeAll(() => {
	MapEntity.create({ data: americaSmallMap })
	Owner.initialize()
})