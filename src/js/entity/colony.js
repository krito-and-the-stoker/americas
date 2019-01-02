import ColonyView from '../view/colony'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'
import Harvest from '../task/harvest'
import Time from '../timeline/time'
import Util from '../util/util'

let colonieNames = ['Jamestown', 'Roanoke', 'Virginia', "Cuper's Cove", "St. John's", 'Henricus']
const getColonyName = () => colonieNames.shift()

const updateStorage = (colony, good, amount) => {
	colony.storage[good] += amount
	colony.storageListeners.forEach(fn => fn(colony.storage))
}

const bindStorage = (colony, fn) => {
	fn(colony.storage)
	colony.storageListeners.push(fn)
}

const create = coords => {
	const colony = {
		name: getColonyName(),
		storageListeners: [],
		storage: {
			food: 0,
			sugar: 0,
			tobacco: 0,
			cotton: 0,
			furs: 0,
			wood: 0,
			ore: 0,
			silver: 0,
			horses: 0,
			rum: 0,
			cigars: 0,
			cloth: 0,
			coats: 0,
			tradeGoods: 0,
			tools: 0,
			guns: 0			
		},
		mapCoordinates: { ...coords }
	}
	colony.screen = ColonyView.createDetailScreen(colony)
	colony.sprite = ColonyView.createMapSprite(colony)

	const tile = MapEntity.tile(coords)
	Tile.colonyProductionGoods(tile).forEach(good => Time.schedule(Harvest.create(colony, tile, good)))	

	return colony
}

const coastalDirection = colony => {
	const center = MapEntity.tile(colony.mapCoordinates)
	const winner = Tile.diagonalNeighbors(center)
		.filter(neighbor => neighbor.coast)
		.map(neighbor => ({
			score: Tile.diagonalNeighbors(neighbor).filter(nn => nn.coast && Tile.diagonalNeighbors(center).includes(nn)).length + 1,
			tile: neighbor
		}))
		.reduce((winner, { tile, score }) => winner.score > score ? winner : { tile, score }, { score: 0 })

	return winner.score > 0 ? Tile.neighborString(center, winner.tile) : null
}

export default {
	create,
	coastalDirection,
	updateStorage,
	bindStorage
}