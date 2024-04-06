import $ from 'signal-chain'

import type { ColonyEntity } from './types'

import Util from 'util/util'

import Unit from 'entity/unit'
import MapEntity from 'entity/map'
import Tile from 'entity/tile'

type TileEntity = {}


const tile = $.unique.chain(
  $.select<ColonyEntity>(),
  $.select(colony => MapEntity.tile(colony.mapCoordinates) as TileEntity)
)

const isCoastal = $.unique.chain(
  tile,
  $.select(center => Tile.radius(center).some(tile => tile.domain === 'sea'))
)

const defender = $.unique.chain(
  $.select<ColonyEntity>(),
  $.listen.key('colonists'),
  $.select(colonists => colonists[colonists.length - 1].unit)
)

const currentConstruction = $.chain(
  $.select<ColonyEntity>(),
  $.combine(
    $.listen.key('constructionTarget'),
    $.listen.key('construction')
  ),
  $.select(([target, construction]) => target ? construction[target] ?? construction.none : construction.none),
)

const toryPercentage = $.unique.chain(
  $.select<ColonyEntity>(),
  $.combine(
    $.chain(
      $.listen.key('colonists'),
      $.select(colonists => colonists.filter(
        colonist => colonist.work?.type === 'Building' && colonist.work.building?.name === 'townhall'
      )),
      $.select(administrators => administrators.length)
    ),
    $.chain(
      $.listen.key('colonists'),
      $.select(colonists => colonists.length)
    ),
    $.listen.key('bells')
  ),
  $.select(([administrators, colonists, bells]) => colonists && Math.max(
    0,
    Math.round(
      100 -
        (100.0 * administrators) / colonists -
        Math.min(100, bells / (colonists + 1))
    )
  )),
)

const tories = $.unique.chain(
  $.combine(
    toryPercentage,
    $.listen.key('colonists')
  ),
  $.select(([percentage, colonists]) => Math.max(0, Math.round((colonists.length * percentage) / 100))),
)

const rebelPercentage = $.unique.chain(
  toryPercentage,
  $.select(percentage => 100 - percentage),
)

const rebels = $.unique.chain(
  $.combine(
    rebelPercentage,
    $.listen.key('colonists')
  ),
  $.select(([percentage, colonists]) => Math.max(0, Math.round((colonists.length * percentage) / 100))),
)

const protection = $.unique.chain(
  $.select<ColonyEntity>(),
  $.combine(
    $.chain(
      $.listen.key('newBuildings'),
      $.select(buildings => buildings.find(b => b.name === 'fortifications')),
      $.select(building => building?.level ?? 0),
      $.select(level => level + 1)
    ),
    $.chain(
      $.listen.key('units'),
      $.select(units => units
        .filter(unit => unit.domain === 'land')
      ),
      $.each(
        $.combine(
          $.select(),
          $.chain(
            $.listen.key('colonist'),
            $.maybe.listen.key('colony'),
            $.select(colony => !colony)
          )
        )
      ),
      $.select(units => units.filter(([_, isNotInColony]) => isNotInColony)),
      $.select(units => units.map(([unit]) => Unit.strength(unit) as number - 1)),
      $.select(strengths => Util.max(strengths)),
      $.select(maxStrength => (maxStrength ?? 0) + 1)
    )
  ),
  $.select(([fortifications, maxStrength]) => fortifications * maxStrength)
)


const coastalDirection = $.unique.chain(
  tile,
  $.combine(
    $.select(),
    $.chain(
      $.select(center => Tile.diagonalNeighbors(center)),
      $.select(neighbors => neighbors
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
  $.select(([center, winner]) => winner.score > 0 ? Tile.neighborString(center, winner.tile) : null)
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
