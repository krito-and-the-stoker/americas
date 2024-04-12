import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Colonist from 'entity/colonist'

const initialGood = 'wood'
export default colonist => {
  const colony = colonist.colony
  const tile = MapEntity.tile(colony.mapCoordinates)
  const winner = Tile.diagonalNeighbors(tile)
    .filter(neighbor => !neighbor.harvestedBy)
    .reduce(
      (winner, neighbor) => {
        const production = Tile.production(neighbor, initialGood, colonist)
        return production > winner.production
          ? {
              production,
              tile: neighbor,
            }
          : winner
      },
      { production: -1 }
    )
  if (winner.tile) {
    Colonist.beginFieldWork(colonist, winner.tile, initialGood)
  } else {
    Colonist.beginColonyWork(colonist, colony.newBuildings.find(building => building.name === 'carpenters'))
  }
}
