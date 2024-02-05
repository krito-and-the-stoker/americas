import Message from 'util/message'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'

import Factory from 'command/factory'

export default Factory.create(
  'Move',
  {
    unit: {
      type: 'entity',
      required: true,
    },
    coords: {
      type: 'raw',
      required: true,
    },
  },
  {
    id: 'move',
    display: 'Travelling',
    icon: 'go',
  },
  ({ unit, coords }) => {
    if (
      coords.x < 0 ||
      coords.y < 0 ||
      coords.x >= MapEntity.get().numTiles.x ||
      coords.y >= MapEntity.get().numTiles.y
    ) {
      Message.warn('coords out of range', coords)
    }

    let active = true
    const targetTile = Tile.get(coords)
    const init = () => {
      Unit.goTo(unit, targetTile)
    }

    const cancel = () => {
      active = false
    }

    const update = () => active && Unit.isMoving(unit)

    return {
      init,
      update,
      cancel,
      priority: true,
    }
  }
)
