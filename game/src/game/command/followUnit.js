import Units from 'data/units'

import LA from 'util/la'
import Util from 'util/util'
import Message from 'util/message'

import Unit from 'entity/unit'
import Tile from 'entity/tile'

import Factory from 'command/factory'
import Move from 'command/move'
import Commander from 'command/commander'

export default Factory.commander(
  'FollowUnit',
  {
    unit: {
      type: 'entity',
      required: true,
    },
    target: {
      type: 'entity',
      required: true,
    },
  },
  {
    id: 'followUnit',
    display: 'Following Unit',
    icon: 'go',
  },
  state => {
    const { unit, target, commander } = state
    let targetTile
    let alive = true

    const init = () => {
      Factory.update.display(state, `Following ${Unit.name(target)}`)

      targetTile = Tile.closest(target.mapCoordinates)
      Commander.scheduleInstead(commander, Move.create({ unit, coords: targetTile.mapCoordinates }))
    }

    const update = () => {
      const closestTile = Tile.closest(target.mapCoordinates)
      if (closestTile !== targetTile ) {
        targetTile = closestTile
        Commander.scheduleInstead(commander, Move.create({ unit, coords: targetTile.mapCoordinates }))
      }

      commander.update()
      return alive && !Util.inMoveDistance(unit, target)
    }

    const cancel = () => {
      alive = false
      Commander.clearSchedule(commander)
    }

    const finished = () => {
      Message.command.log('Finished pursuit', Unit.name(unit), '->', Unit.name(target))
    }

    return {
      init,
      update,
      cancel,
      finished
    }
  }
)
