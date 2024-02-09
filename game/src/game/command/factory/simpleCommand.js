import Message from 'util/message'
import Util from 'util/util'

import CommandRegistry from './registry'
import Serialization from './serialization'


// Core factory function for creating command objects with specific behavior and data.
const create = (name, commandData, commandMeta, commandBehaviorFactory) => {
  const serializationMethods = Serialization.generateSerializationMethods(name) // Generates serialization methods for the command.

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

    return Serialization.revive(createCommand(args))
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

export default {
  create
}
