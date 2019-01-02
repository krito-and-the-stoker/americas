import ColonyView from '../view/colony'
import MapEntity from '../entity/map'
import Tile from '../entity/tile'

let colonieNames = ['Jamestown', 'Roanoke', 'Virginia', "Cuper's Cove", "St. John's", 'Henricus']
const getColonyName = () => colonieNames.shift()

const create = coords => {
	const colony = {
		name: getColonyName(),
		mapCoordinates: { ...coords }
	}
	colony.screen = ColonyView.createDetailScreen(colony)
	colony.sprite = ColonyView.createMapSprite(colony)

	return colony
}

const coastalDirection = colony => {
	const center = MapEntity.tile(colony.mapCoordinates)
	const winner = Tile.diagonalNeighbors(center)
		.filter(neighbor => neighbor.coast)
		.map(neighbor => ({
			score: Tile.diagonalNeighbors(neighbor).filter(nn => nn.coast && Tile.diagonalNeighbors(center).includes(nn)).length,
			tile: neighbor
		}))
		.reduce((winner, { tile, score }) => winner.score > score ? winner : { tile, score }, { score: 0 })

	return winner.score > 0 ? Tile.neighborString(center, winner.tile) : null
}

export default {
	create,
	coastalDirection
}