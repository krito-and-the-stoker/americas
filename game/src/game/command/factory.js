// Importing necessary modules and components for command handling, utilities, and messaging.
import Commander from 'command/commander'
import UnloadCommand from 'command/unload'

import Message from 'util/message'
import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'

// Defines a registry for commands to manage dependencies and avoid circular import issues.
const CommandRegistry = {
  Unload: UnloadCommand
}

// Function to generate serialization methods for a command, enabling saving and loading of command states.
const generateSerializationMethods = name => {
  const serializationMethods = {
    save: {
      raw: x => x, // Saves raw data as-is.
      entity: x => Record.reference(x), // Transforms entity into a reference for saving.
      command: x => (x ? x.save() : null), // Saves a command if present, otherwise returns null.
      commands: x => x.filter(y => !!y).map(y => y.save()), // Filters out falsy commands and saves the rest.
      name: () => name, // Saves the command's name.
    },
    load: {
      raw: x => x, // Loads raw data as-is.
      entity: x => Record.dereference(x), // Dereferences an entity during loading.
      command: x => {
        // Loads a command based on its module, either from Commander or CommandRegistry.
        if (x) {
          if (x.module === 'Commander') {
            return Commander.load(x)
          }
          return CommandRegistry[x.module].load(x)
        }
        return null
      },
      commands: x => x.filter(y => !!y).map(y => serializationMethods.load.command(y)), // Filters and loads commands.
      name: () => name, // Loads the command's name.
    },
  }
  return serializationMethods
}

// Revives a command after it has been loaded, ensuring any necessary initialization is performed.
const revive = command => {
  if (command.loaded) {
    command.loaded() // Calls the loaded hook if present.
  }
  return command
}

// Core factory function for creating command objects with specific behavior and data.
const create = (name, commandData, commandMeta, commandBehaviorFactory) => {
  const serializationMethods = generateSerializationMethods(name) // Generates serialization methods for the command.

  // Initializes commandData with default raw types for tag and initHasBeenCalled.
  commandData.tag = { type: 'raw' }
  commandData.initHasBeenCalled = { type: 'raw' }

  // Main function to create a command object, configuring it with provided arguments.
  const createCommand = (args = {}) => {
    // Validates and initializes command arguments, setting up the command object.
    // Includes logic for handling required and default arguments, cloning defaults, and setting initialized values.
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
      // Saves the command state, converting each property based on its type using serialization methods.
     return Util.makeObject(
        Object.entries(commandData)
          .concat([['module', { type: 'name' }]])
          .map(([key, description]) => [key, serializationMethods.save[description.type](args[key])])
      )
    }

    // Constructs the command's behavior and finalizes its initialization.
    const commandFunctions = commandBehaviorFactory(args)
    // Overrides and enhances specific command functions (e.g., init) if necessary.
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

    // Returns the assembled command object with behavior methods, save functionality, and state information.
    return {
      ...commandFunctions,
      save: saveCommandState,
      tag: args.tag,
      state: args,
    }
  }

  // Loads a command from saved data, reconstituting its state and behavior.
  const loadCommand = data => {
    // Rebuilds the command's arguments from saved data and revives the command object.
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

  // Registers the command in the CommandRegistry for later loading and creation.
  CommandRegistry[name] = {
    create: createCommand,
    load: loadCommand
  }

  // Exposes the create and load functions for the command.
  return {
    create: createCommand,
    load: loadCommand,
  }
}

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
const createWithCommander = (name, commandData, commandMeta, commandBehaviorFactory) => {
  // Builds upon the basic command creation process, ensuring the command is tied to a Commander instance for enhanced control.
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

// Utility functions for updating command states, such as information and display properties.
const update = {
  info: (state, info) => Binding.update(state, 'info', info),
  display: (state, display) => Binding.update(state, 'info', { ...state.info, display }),
}

// Exports the main functionalities of the module, making them available for use elsewhere in the application.
export default { create, commander: createWithCommander, update }
