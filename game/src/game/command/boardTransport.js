import LA from 'util/la'
import Time from 'timeline/time'

import Unit from 'entity/unit'
import leaveColony from 'interaction/leaveColony'

import Factory from 'command/factory'

export default Factory.create(
  'BoardTransport',
  {
    transport: {
      type: 'entity',
      required: true,
    },
    passenger: {
      type: 'entity',
      required: true,
    },
    initialCoordinates: {
      type: 'raw'
    },
    eta: {
      type: 'raw',
    },
  },
  {
    id: 'boardTransport',
    display: 'Boarding transport',
  },
  state => {
    let { transport, passenger, eta, initialCoordinates } = state
    Factory.update.display(state, `Boarding ${Unit.name(transport)}`)
    const init = currentTime => {
      eta = currentTime + Time.LOAD_TIME
      Unit.update.isBoarding(passenger, true)
      initialCoordinates = { ...passenger.mapCoordinates }
      if (passenger.colony) {
        leaveColony(passenger)
      }

      return {
        eta,
        initialCoordinates
      }
    }

    const update = currentTime => {
      const progress = (Time.LOAD_TIME + currentTime - eta) / Time.LOAD_TIME
      const position = LA.lerp(transport.mapCoordinates, initialCoordinates, progress)
      Unit.update.mapCoordinates(passenger, position)

      return currentTime < eta
    }

    const finished = () => {
      Unit.update.isBoarding(passenger, false)
      if (!Unit.loadUnit(transport, passenger)) {
        // TODO abort!
      }      
    }

    return {
      init,
      update,
      finished,
      priority: true,
    }
  }
)
