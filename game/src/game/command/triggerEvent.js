import Events from 'util/events'

import Factory from 'command/factory'

export default Factory.create(
  'TriggerEvent',
  {
    name: {
      type: 'raw',
      required: true,
    },
    type: {
      type: 'raw',
    },
    unit: {
      type: 'entity',
    },
    colony: {
      type: 'entity',
    },
    id: {
      type: 'raw',
    },
    wait: {
      type: 'raw',
      default: 0,
    },
    eta: {
      type: 'raw',
    },
  },
  {
    id: 'triggerEvent',
    display: 'Triggering event',
  },
  state => {
    const { name, type, unit, colony, id, wait } = state
    const init = currentTime => {
      return {
        eta: currentTime + wait,
      }
    }

    const update = currentTime => state.eta && currentTime < state.eta
    const finished = () => {
      if (state.eta) {
        Events.trigger(name, { type, unit, colony, id })
      }
    }

    const cancel = () => {
      state.eta = null
    }

    return {
      init,
      cancel,
      update,
      finished,
    }
  }
)
