import Util from 'util/util'
import Binding from 'util/binding'

import Time from 'timeline/time'

import Factory from 'command/factory'

import InvestigateRumors from 'interaction/investigateRumors'
import EnterSettlement from 'interaction/enterSettlement'

const cancel = () => ({
  update: () => false,
})

const scheduleInstead = (commander, command) => {
  schedule.instead(commander, command)
}

const scheduleBehind = (commander, command) => {
  schedule.behind(commander, command)
}

const clearSchedule = commander => {
  schedule.clear(commander)
}

const schedule = {
  instead: (parent, child) => {
    schedule.clear(parent)
    schedule.behind(parent, child)
  },
  behind: (parent, child) => {
    parent.state.commands.push(child)
  },
  clear: parent => {
    parent.state.commands.forEach(cmd => Util.execute(cmd.canceled))
    parent.state.commands = []
    if (parent.state.currentCommand) {
      Util.execute(parent.state.currentCommand.cancel)
    }
  },
}

const startCurrentCommand = state => {
  const command = state.currentCommand
  const originalFinished = command.finished

  const unsubscribeCommandInfo = Binding.listen(command.state, 'info', info =>
    Binding.update(state, 'info', info)
  )

  state.currentCommand.finished = () => {
    Util.execute(originalFinished)
    Util.execute(unsubscribeCommandInfo)
    state.currentCommand = null
    Binding.update(state, 'info', {
      id: 'idle',
      display: 'Waiting for orders',
    })
  }

  return [Time.schedule(command), unsubscribeCommandInfo]
}

const { create, load } = Factory.create(
  'Commander',
  {
    keep: {
      type: 'raw',
      default: false,
    },
    unit: {
      type: 'entity',
    },
    commands: {
      type: 'commands',
      default: [],
    },
    currentCommand: {
      type: 'command',
    },
  },
  {
    id: 'idle',
    display: 'Waiting for orders',
  },
  state => {
    const { keep, unit } = state
    let unschedule = null
    // TODO: this does not belong here!
    let done = {
      investigateRumors: false,
      enterSettlement: false,
    }

    const update = () => {
      if (!state.currentCommand && state.commands.length > 0) {
        state.currentCommand = state.commands.shift()
        unschedule = startCurrentCommand(state)

        done.investigateRumors = false
        done.enterSettlement = false
      }

      if (unit && !state.currentCommand && state.commands.length === 0) {
        if (unit.owner.input && unit.tile && unit.tile.rumors && !done.investigateRumors) {
          done.investigateRumors = true
          InvestigateRumors(unit)
        }

        if (unit.owner.input && unit.tile && unit.tile.settlement && !done.enterSettlement) {
          done.enterSettlement = true
          EnterSettlement(unit.tile.settlement, unit)
        }
      }

      const shouldStayAlive = keep || state.currentCommand || state.commands.length > 0
      return shouldStayAlive
    }

    const stopped = () => {
      Util.execute(unschedule)
    }

    const loaded = () => {
      if (state.currentCommand) {
        // console.log('hook', state.tag, 'starts', state.currentCommand.tag, state.currentCommand)
        unschedule = startCurrentCommand(state)
      }
    }

    const cancel = () => {
      schedule.clear({ state })
    }

    const commander = {
      priority: true,
      update,
      stopped,
      loaded,
      cancel,
    }

    return commander
  }
)

export default {
  create,
  load,
  cancel,
  scheduleInstead,
  scheduleBehind,
  clearSchedule,
}
