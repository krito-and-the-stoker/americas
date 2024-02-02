import seed from 'seed-random'
import americaSmallMap from 'data/america-small-incompatible'

import PathFinder from 'util/pathFinder'

import Owner from 'entity/owner'
import MapEntity from 'entity/map'
import Europe from 'entity/europe'
import Market from 'entity/market'
import Tribe from 'entity/tribe'
import Treasure from 'entity/treasure'


beforeAll(() => {
	seed('1234', { global: true })

	MapEntity.create({ data: americaSmallMap })
	Owner.initialize()
	PathFinder.initialize()	
	Europe.initialize()
	Treasure.initialize()
	Market.initialize()
	Tribe.createFromMap(MapEntity.get())
})