import Record from 'util/record'
import Commander from 'command/commander'
import CommandRegistry from './registry'

// Revives a command after it has been loaded, ensuring any necessary initialization is performed.
const revive = command => {
  if (command.loaded) {
    command.loaded() // Calls the loaded hook if present.
  }
  return command
}


// Function to generate serialization methods for a command, enabling saving and loading of command states.
const generateSerializationMethods = commandName => {
  const serializationMethods = {
    save: {
      raw: x => x, // Saves raw data as-is.
      entity: x => Record.reference(x), // Transforms entity into a reference for saving.
      command: x => (x ? x.save() : null), // Saves a command if present, otherwise returns null.
      commands: x => x.filter(y => !!y).map(y => y.save()), // Filters out falsy commands and saves the rest.
      name: () => commandName, // Saves the command's name.
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
          return CommandRegistry.get(x.module).load(x)
        }
        return null
      },
      commands: x => x.filter(y => !!y).map(y => serializationMethods.load.command(y)), // Filters and loads commands.
      name: () => commandName, // Loads the command's name.
    },
  }

  return serializationMethods
}


export default {
  revive,
  generateSerializationMethods
}