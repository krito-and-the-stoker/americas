import americaSmallMap from 'data/america-small-incompatible'

import PathFinder from 'util/pathFinder'
import Owner from 'entity/owner'
import MapEntity from 'entity/map'
import Europe from 'entity/europe'
import Market from 'entity/market'
import Tribe from 'entity/tribe'


beforeAll(() => {
	MapEntity.create({ data: americaSmallMap })
	Owner.initialize()
	PathFinder.initialize()	
	Europe.initialize()
	Market.initialize()
	Tribe.createFromMap(MapEntity.get())
})