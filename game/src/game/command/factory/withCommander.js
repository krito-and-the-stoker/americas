import Util from 'util/util'
import Commander from 'command/commander'

import CommandRegistry from './registry'
import Serialization from './serialization'
import SimpleCommand from './simpleCommand'


// Enhances a command object with additional functionality provided by a Commander instance.
const enhanceCommandWithCommander = (commander, command) => {
  // Wraps the command with new behaviors (update, stopped, cancel), integrating it with Commander's capabilities.
  const wrappedCommand = {
    ...command,
    update: (...args) => {
      if (command.update) {
        if (!command.update(...args)) {
          // TODO: why is this here, why should it maybe not be here?
          // commander.schedule.stop()
        }
      }

      return commander.update(...args)
    },
    stopped: (...args) => {
      Util.execute(command.stopped, ...args)
      Util.execute(commander.stopped, ...args)
    },
    cancel: () => {
      Util.execute(commander.cancel)
    },
    priority: true,
    tag: `Wrapped ${command.tag}`,
  }

  return wrappedCommand
}

// Extends the create function to automatically incorporate a Commander instance for managing command lifecycle.
const create = (name, commandData, commandMeta, commandBehaviorFactory) => {
  // Builds upon the basic command creation process, ensuring the command is tied to a Commander instance for enhanced control.
  const serializationMethods = Serialization.generateSerializationMethods(name)
  commandData.commander = { type: 'command' }
  commandData.initHasBeenCalled = { type: 'raw' }

  const command = {
    create: (...args) => {
      const commander = Commander.create()
      commandData.commander.initialized = commander
      const commandFactory = SimpleCommand.create(name, commandData, commandMeta, commandBehaviorFactory)
      const innerCommand = commandFactory.create(...args)

      return enhanceCommandWithCommander(commander, innerCommand)
    },
    load: data => {
      const commander = Commander.load(data.commander)

      const args = Util.makeObject(
        Object.entries(commandData)
          .filter(([key]) => key !== 'commander')
          .map(([key, description]) => [key, serializationMethods.load[description.type](data[key])])
      )
      args.commander = commander
      const innerCommand = Serialization.revive(create(name, commandData, commandMeta, commandBehaviorFactory).create(args))

      return enhanceCommandWithCommander(commander, innerCommand)
    },
  }

  CommandRegistry[name] = command
  return command
}

export default {
  create
}