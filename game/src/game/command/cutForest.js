import Util from 'util/util'
import Events from 'util/events'
import PathFinder from 'util/pathFinder'

import Time from 'timeline/time'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Storage from 'entity/storage'
import Unit from 'entity/unit'

import Factory from 'command/factory'

export default Factory.create(
  'CutForest',
  {
    unit: {
      type: 'entity',
      required: true,
    },
    eta: {
      type: 'raw',
    },
  },
  {
    id: 'cutForest',
    display: 'Cutting forest',
  },
  state => {
    const { unit } = state

    const init = currentTime => {
      const tile = unit.tile
      if (tile && unit.properties.canTerraform && tile.forest && !tile.settlement) {
        const closeColony = PathFinder.findNearColony(unit)
        const colonyText = closeColony ? ` near ${closeColony.name}` : ''
        Factory.update.display(state, `Cutting forest${colonyText}`)
        return {
          eta: currentTime + Time.CUT_FOREST * (unit.expert === 'pioneer' ? 0.6 : 1),
        }
      }
    }

    const cancel = () => {
      state.eta = null
    }

    const update = currentTime => state.eta && currentTime < state.eta
    const finished = () => {
      if (state.eta) {
        Storage.update(unit.equipment, {
          good: 'tools',
          amount: -Unit.TERRAFORM_TOOLS_CONSUMPTION,
        })
        const tile = unit.tile
        Tile.clearForest(tile)
        const colony = Util.choose(
          Tile.radius(tile)
            .filter(tile => tile.colony)
            .map(tile => tile.colony)
        )
        if (colony) {
          const amount = 10 + Math.random() * (unit.expert === 'pioneer' ? 90 : 50)
          Storage.update(colony.storage, { good: 'wood', amount })
        }
        Events.trigger('notification', { type: 'terraforming', unit })
        Events.trigger('terraform')
      }
    }

    return {
      init,
      update,
      cancel,
      finished,
    }
  }
)
