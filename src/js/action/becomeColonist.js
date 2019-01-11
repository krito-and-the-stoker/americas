import Colonist from '../entity/colonist'
import JoinColony from './joinColony'
import Unit from '../entity/unit'
import Tile from '../entity/tile'
import MapEntity from '../entity/map'

export default (colony, unit) => {
	const colonist = Colonist.create(unit)
	Unit.update.colonist(unit, colonist)
	JoinColony(colony, colonist)

	const tile = MapEntity.tile(colony.mapCoordinates)
	const winner = Tile.diagonalNeighbors(tile)
		.filter(neighbor => !neighbor.harvestedBy)
		.reduce((winner, neighbor) => {
			const production = Tile.production(neighbor, 'food', colonist)
			return production > winner.production ? {
				production,
				tile: neighbor
			 } : winner
		},
		{ production: -1 })
	if (winner.tile) {
		Colonist.beginFieldWork(colonist, winner.tile, 'food')
	}
}