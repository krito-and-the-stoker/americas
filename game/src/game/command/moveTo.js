import Units from 'data/units'

import LA from 'util/la'
import PathFinder from 'util/pathFinder'
import Message from 'util/message'

import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Tile from 'entity/tile'

import Factory from 'command/factory'
import Move from 'command/move'
import Commander from 'command/commander'
import Unload from 'command/unload'

const canLoad = ship =>
  !ship.commander.state.currentCommand ||
  ship.commander.state.currentCommand.type === 'load' ||
  ship.commander.state.currentCommand.type === 'unload'

const canLoadTreasure = ship =>
  (!ship.commander.state.currentCommand ||
    ship.commander.state.currentCommand.type === 'load' ||
    ship.commander.state.currentCommand.type === 'unload') &&
  ship.properties.canTransportTreasure

const inMoveDistance = (coords1, coords2) => LA.distanceManhatten(coords1, coords2) <= 1

export default Factory.commander(
  'MoveTo',
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
    id: 'moveTo',
    display: 'Travelling',
    icon: 'go',
  },
  state => {
    const { unit, coords, commander } = state
    if (
      coords.x < 0 ||
      coords.y < 0 ||
      coords.x >= MapEntity.get().numTiles.x ||
      coords.y >= MapEntity.get().numTiles.y
    ) {
      Message.command.warn('invalid coords', Unit.name(unit), coords)
    }

    if (!MapEntity.tile(coords)) {
      Message.command.warn('no targetTile', coords, Unit.name(unit), state)
      coords.x = Math.round(coords.x)
      coords.y = Math.round(coords.y)
    }

    const init = () => {
      const targetTile = MapEntity.tile(coords)

      let displayName =
        (unit.domain === 'land' ? 'Travelling to ' : 'Navigating to ') +
        Tile.description(targetTile, unit.owner)

      Factory.update.display(state, displayName)

      Commander.scheduleInstead(commander, Move.create({ unit, coords }))
    }

    const finished = () => {
      const target = Tile.get(coords)

      if (
        unit.domain === 'sea' &&
        unit.passengers.length > 0 &&
        target.domain === 'land' &&
        !target.colony &&
        Tile.radius(target).includes(unit.tile)
      ) {
        Commander.scheduleInstead(unit.commander, Unload.create(unit, target.mapCoordinates))
      }
    }

    return {
      init,
      finished,
    }
  }
)
