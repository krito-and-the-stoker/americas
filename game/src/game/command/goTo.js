import PathFinder from 'util/pathFinder'
import Binding from 'util/binding'

import MapEntity from 'entity/map'
import Europe from 'entity/europe'
import Unit from 'entity/unit'
import Tile from 'entity/tile'

import Commander from 'command/commander'
import Factory from 'command/factory'
import MoveTo from 'command/moveTo'
import America from 'command/america'
import EuropeCommand from 'command/europe'
import TriggerEvent from 'command/triggerEvent'

export default Factory.commander(
  'GoTo',
  {
    unit: {
      type: 'entity',
      required: true,
    },
    colony: {
      type: 'entity',
      default: null,
    },
    europe: {
      type: 'raw',
      default: false,
    },
    showNotification: {
      type: 'raw',
      default: true
    }
  },
  {
    id: 'goTo',
    display: 'Travelling',
    icon: 'go',
  },
  state => {
    const { unit, colony, europe, commander } = state

    const init = () => {
      if (colony) {
        // from europe to colony
        if (Europe.has.unit(unit)) {
          const path = PathFinder.findHighSeas(unit.mapCoordinates, unit)
          Unit.update.mapCoordinates(unit, path[path.length - 1].mapCoordinates)
          Commander.scheduleBehind(commander, America.create({ unit }))
          Commander.scheduleBehind(
            commander,
            MoveTo.create({ unit, coords: colony.mapCoordinates })
          )
          if (state.showNotification) {
            Commander.scheduleBehind(
              commander,
              TriggerEvent.create({
                name: 'notification',
                type: 'arrive',
                unit,
                colony,
              })
            )
          }
        } else {
          // from somewhere to colony
          Commander.scheduleBehind(
            commander,
            MoveTo.create({ unit, coords: colony.mapCoordinates })
          )
          if (state.showNotification) {
            Commander.scheduleBehind(
              commander,
              TriggerEvent.create({
                name: 'notification',
                type: 'arrive',
                unit,
                colony,
              })
            )
          }
        }

        Factory.update.display(state, `Travelling to ${colony.name}`)
      }

      if (europe) {
        if (!Europe.has.unit(unit)) {
          // from somehwere to europe
          const pathToHighSeas = PathFinder.findHighSeas(unit.mapCoordinates, unit)
          const targetCoordinates = pathToHighSeas[pathToHighSeas.length - 1]
          Commander.scheduleInstead(
            commander,
            MoveTo.create({ unit, coords: targetCoordinates })
          )
          Commander.scheduleBehind(commander, EuropeCommand.create({ unit }))
          if (state.showNotification) {
            Commander.scheduleBehind(
              commander,
              TriggerEvent.create({
                name: 'notification',
                type: 'europe',
                unit,
              })
            )
          }
        }

        // from europe to europe -> nothing to do
        Factory.update.display(state, 'Travelling to London')
      }
    }

    return {
      init,
    }
  }
)
