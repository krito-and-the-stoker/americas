import type { ColonyEntity } from '.'

import Util from 'util/util'
import Signal from 'util/signal-ts'


import Unit from 'entity/unit'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'

type TileEntity = {}


const tile = Signal.chain(
  Signal.select<ColonyEntity>(),
  Signal.select(colony => MapEntity.tile(colony.mapCoordinates) as TileEntity)
)

const isCoastal = Signal.chain(
  tile,
  Signal.select(center => Tile.radius(center).some(tile => tile.domain === 'sea'))
)

const defender = Signal.chain(
  Signal.select<ColonyEntity>(),
  Signal.key('colonists'),
  Signal.select(colonists => colonists[colonists.length - 1].unit)
)

const currentConstruction = Signal.chain(
  Signal.select<ColonyEntity>(),
  Signal.combine(
    Signal.key('constructionTarget'),
    Signal.key('construction')
  ),
  Signal.select(([target, construction]) => target ? construction[target] ?? construction.none : construction.none),
)

const toryPercentage = Signal.chain(
  Signal.select<ColonyEntity>(),
  Signal.combine(
    Signal.chain(
      Signal.key('colonists'),
      Signal.select(colonists => colonists.filter(
        colonist => colonist.work?.type === 'Building' && colonist.work.building?.name === 'townhall'
      )),
      Signal.select(administrators => administrators.length)
    ),
    Signal.chain(
      Signal.key('colonists'),
      Signal.select(colonists => colonists.length)
    ),
    Signal.key('bells')
  ),
  Signal.select(([administrators, colonists, bells]) => Math.max(
    0,
    Math.round(
      100 -
        (100.0 * administrators) / colonists -
        Math.min(100, bells / (colonists + 1))
    )
  ))
)

const tories = Signal.chain(
  Signal.combine(
    toryPercentage,
    Signal.key('colonists')
  ),
  Signal.select(([percentage, colonists]) => Math.max(0, Math.round((colonists.length * percentage) / 100)))
)

const rebelPercentage = Signal.chain(
  toryPercentage,
  Signal.select(percentage => 100 - percentage)
)

const rebels = Signal.chain(
  Signal.combine(
    rebelPercentage,
    Signal.key('colonists')
  ),
  Signal.select(([percentage, colonists]) => Math.max(0, Math.round((colonists.length * percentage) / 100)))
)

const protection = Signal.chain(
  Signal.select<ColonyEntity>(),
  Signal.combine(
    Signal.chain(
      Signal.key('newBuildings'),
      Signal.select(buildings => buildings.find(b => b.name === 'fortifications')),
      Signal.select(building => building?.level ?? 0),
      Signal.select(level => level + 1)
    ),
    Signal.chain(
      Signal.key('units'),
      Signal.select(units => units
        .filter(unit => unit.domain === 'land')
      ),
      Signal.each(
        Signal.combine(
          Signal.select(),
          Signal.chain(
            Signal.key('colonist'),
            Signal.maybe.key('colony'),
            Signal.select(colony => !colony)
          )
        )
      ),
      Signal.select(units => units.filter(([_, isNotInColony]) => isNotInColony)),
      Signal.select(units => units.map(([unit]) => Unit.strength(unit) as number - 1)),
      Signal.select(strengths => Util.max(strengths)),
      Signal.select(maxStrength => (maxStrength ?? 0) + 1)
    )
  ),
  Signal.select(([fortifications, maxStrength]) => fortifications * maxStrength)
)


const coastalDirection = Signal.chain(
  tile,
  Signal.combine(
    Signal.select(),
    Signal.chain(
      Signal.select(center => Tile.diagonalNeighbors(center)),
      Signal.select(neighbors => neighbors
        .filter(neighbor => neighbor.coast)
        .map(neighbor => ({
          score: Tile.diagonalNeighbors(neighbor).filter(
            nn => nn.coast && neighbors.includes(nn)
          ).length + 1,
          tile: neighbor,
        }))
        .reduce((winner, { tile, score }) => winner.score > score ? winner : { tile, score }, { score: 0, tile: null })
      ),
    )
  ),
  Signal.select(([center, winner]) => winner.score > 0 ? Tile.neighborString(center, winner.tile) : null)
)

export default {
  // unused
  coastalDirection,
  isCoastal,
  protection,

  // used
  currentConstruction,
  defender,
  tile,
  rebels,
  rebelPercentage,
  tories,
  toryPercentage,
}
