import Commander from 'command/commander'
import UnloadCommand from 'command/unload'

import Message from 'util/message'
import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'

// Registry for all available commands to avoid circular dependencies
const CommandRegistry = {
  Unload: UnloadCommand
}

const generateSerializationMethods = name => {
  const serializationMethods = {
    save: {
      raw: x => x,
      entity: x => Record.reference(x),
      command: x => (x ? x.save() : null),
      commands: x => x.filter(y => !!y).map(y => y.save()),
      name: () => name,
    },

    load: {
      raw: x => x,
      entity: x => Record.dereference(x),
      command: x => {
        if (x) {
          if (x.module === 'Commander') {
            return Commander.load(x)
          }

          return CommandRegistry[x.module].load(x)
        }
        return null
      },
      commands: x => x.filter(y => !!y).map(y => serializationMethods.load.command(y)),
      name: () => name,
    },
  }

  return serializationMethods
}

const revive = command => {
  if (command.loaded) {
    command.loaded()
  }

  return command
}

const create = (name, commandData, commandMeta, commandBehaviorFactory) => {
  const serializationMethods = generateSerializationMethods(name)

  commandData.tag = { type: 'raw' }
  commandData.initHasBeenCalled = { type: 'raw' }

  const createCommand = (args = {}) => {
    Object.keys(args).forEach(key => {
      if (!commandData[key]) {
        Message.warn('Unspecified command creation argument', key, args, commandData)
      }
    })

    args.tag = args.tag || `${name} - ${Util.tag()}`
    args.info = args.info || commandMeta

    Object.entries(commandData)
      .filter(([, description]) => description.required)
      .forEach(([key, description]) => {
        if (typeof args[key] === 'undefined') {
          throw new Error(
            `Invalid command invocation. name: ${name}, key: ${key}, arg: ${args[key]}, type: ${description.type}, required: ${description.required}`
          )
        }
      })

    Object.entries(commandData)
      .filter(([, description]) => typeof description.default !== 'undefined')
      .filter(([key]) => typeof args[key] === 'undefined')
      .forEach(([key, description]) => {
        args[key] = Util.clone(description.default)
      })

    Object.entries(commandData)
      .filter(([, description]) => typeof description.initialized !== 'undefined')
      .forEach(([key, description]) => {
        args[key] = description.initialized
      })

    const saveCommandState = () => {
      return Util.makeObject(
        Object.entries(commandData)
          .concat([['module', { type: 'name' }]])
          .map(([key, description]) => [key, serializationMethods.save[description.type](args[key])])
      )
    }

    const commandFunctions = commandBehaviorFactory(args)
    if (args.initHasBeenCalled) {
      delete commandFunctions.init
    }

    if (commandFunctions.init) {
      const originalInit = commandFunctions.init

      commandFunctions.init = (...initArgs) => {
        const initResult = originalInit(...initArgs)
        if (initResult) {
          Object.assign(args, initResult)
        }
        Object.assign(args, { initHasBeenCalled: true })

        return true
      }
    }

    return {
      ...commandFunctions,
      save: saveCommandState,
      tag: args.tag,
      state: args,
    }
  }

  const loadCommand = data => {
    const args = Util.makeObject(
      Object.entries(commandData).map(([key, description]) => [
        key,
        serializationMethods.load[description.type](
          data[key] || (description.default && Util.clone(description.default))
        ),
      ])
    )

    return revive(createCommand(args))
  }

  // Save command for later loading
  CommandRegistry[name] = {
    create: createCommand,
    load: loadCommand
  }

  return {
    create: createCommand,
    load: loadCommand,
  }
}

const enhanceCommandWithCommander = (commander, command) => {
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

const createWithCommander = (name, commandData, commandMeta, commandBehaviorFactory) => {
  const serializationMethods = generateSerializationMethods(name)
  commandData.commander = { type: 'command' }
  commandData.initHasBeenCalled = { type: 'raw' }

  const command = {
    create: (...args) => {
      const commander = Commander.create()
      commandData.commander.initialized = commander
      const commandFactory = create(name, commandData, commandMeta, commandBehaviorFactory)
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
      const innerCommand = revive(create(name, commandData, commandMeta, commandBehaviorFactory).create(args))

      return enhanceCommandWithCommander(commander, innerCommand)
    },
  }

  CommandRegistry[name] = command
  return command
}

const update = {
  info: (state, info) => Binding.update(state, 'info', info),
  display: (state, display) => Binding.update(state, 'info', { ...state.info, display }),
}

export default { create, commander: createWithCommander, update }
