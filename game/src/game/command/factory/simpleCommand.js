import Message from 'util/message'
import Util from 'util/util'

import CommandRegistry from './registry'
import Serialization from './serialization'


// Core factory function for creating command objects with specific behavior and data.
const create = (name, dataDescription, commandMeta, commandBehaviorFactory) => {

  // Initializes dataDescription with default raw types for tag and initHasBeenCalled.
  dataDescription.tag = { type: 'raw' }
  dataDescription.initHasBeenCalled = { type: 'raw' }

  // Main function to create a conrete command, configuring it with provided arguments.
  const createCommand = (args = {}) => {
    // Validating Command Arguments Against Specifications
    for (const key in args) {
        if (!dataDescription[key]) {
            Message.warn('Unspecified command creation argument', key, args, dataDescription);
        }
    }

    // the tag is used for debugging and command matching
    args.tag = args.tag || `${name} - ${Util.tag()}`
    args.info = args.info || commandMeta

    // Check for Required Fields
    for (const [key, description] of Object.entries(dataDescription)) {
        if (description.required && typeof args[key] === 'undefined') {
            throw new Error(
                `Invalid command invocation. name: ${name}, key: ${key}, arg: ${args[key]}, type: ${description.type}, required: ${description.required}`
            );
        }
    }

    // Set Defaults
    for (const [key, description] of Object.entries(dataDescription)) {
        if (typeof description.default !== 'undefined' && typeof args[key] === 'undefined') {
            args[key] = Util.clone(description.default);
        }
    }

    // Initialize with Predefined Values
    for (const [key, description] of Object.entries(dataDescription)) {
        if (typeof description.initialized !== 'undefined') {
            args[key] = description.initialized;
        }
    }


    // Saves the command state, converting each property based on its type using serialization methods.
    const saveCommandState = () => {
      let serializedState = {};

      // Populate serializedState
      for (const [key, description] of Object.entries(dataDescription)) {
          serializedState[key] = Serialization.save[description.type](args[key]);
      }

      // Manually add the 'module' entry with its description
      serializedState['module'] = Serialization.save.name(name);
      return serializedState;
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
  const loadCommand = rawData => {
    // Rebuilds the command's arguments from saved data and revives the command object.
    let unserializedCommandData = {}

    for (const [key, description] of Object.entries(dataDescription)) {
        // Determine the value to load
        // take rawData[key] if present, or clone default value
        let value = rawData[key]
        if (value === undefined && description.default !== undefined) {
            value = Util.clone(description.default)
        }
        // Apply the load method based on the description type
        unserializedCommandData[key] = Serialization.load[description.type](value);
    }

    return Serialization.revive(createCommand(unserializedCommandData))
  }

  // Registers the command in the CommandRegistry for later loading and creation.
  CommandRegistry.add(name, {
    create: createCommand,
    load: loadCommand
  })

  // Exposes the create and load functions for the command.
  return {
    create: createCommand,
    load: loadCommand,
  }
}

export default {
  create
}
