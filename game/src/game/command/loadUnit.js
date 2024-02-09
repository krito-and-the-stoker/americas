import LA from 'util/la'
import Time from 'timeline/time'

import Unit from 'entity/unit'
import leaveColony from 'interaction/leaveColony'

import Factory from 'command/factory'

export default Factory.create(
  'LoadUnit',
  {
    transport: {
      type: 'entity',
      required: true,
    },
    passenger: {
      type: 'entity',
      required: true,
    },
    eta: {
      type: 'raw',
    },
  },
  {
    id: 'loadUnit',
    display: 'Loading unit',
  },
  state => {
    let { transport, passenger, eta } = state
    Factory.update.display(state, `Loading ${Unit.name(passenger)}`)

    const init = currentTime => {
      eta = currentTime + Time.LOAD_TIME
      return {
        eta,
      }
    }

    const update = currentTime => {
      return currentTime < eta
    }

    return {
      init,
      update,
    }
  }
)
