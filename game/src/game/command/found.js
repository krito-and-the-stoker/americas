import Events from 'util/events'

import Colony from 'entity/colony'
import Tile from 'entity/tile'
import Unit from 'entity/unit'

import Factory from 'command/factory'

import FindWork from 'interaction/findWork'
import EnterColony from 'interaction/enterColony'
import JoinColony from 'interaction/joinColony'

export default Factory.create(
  'Found',
  {
    unit: {
      type: 'entity',
      required: true,
    },
  },
  {
    id: 'found',
    display: 'Founding Colony',
  },
  ({ unit }) => {
    const init = () => {
      if (!unit.properties.canFound) {
        return
      }

      const tile = unit.tile
      if (!tile || tile.settlement) {
        return
      }
      if (Tile.radius(tile).some(neighbor => neighbor.colony)) {
        return
      }

      Tile.constructRoad(tile)
      const colony = Colony.create(unit.mapCoordinates, unit.owner)
      Unit.at(unit.mapCoordinates).forEach(unit => {
        EnterColony(colony, unit)
      })
      JoinColony(colony, unit.colonist)
      FindWork(unit.colonist)

      Events.trigger('found', { colony })
    }

    return {
      init,
    }
  }
)
