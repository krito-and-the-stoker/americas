// Importing necessary modules and components for command handling, utilities, and messaging.
import Binding from 'util/binding'

import WithCommander from './withCommander'
import SimpleCommand from './simpleCommand'

// Utility functions for updating command states, such as information and display properties.
const update = {
  info: (state, info) => Binding.update(state, 'info', info),
  display: (state, display) => Binding.update(state, 'info', { ...state.info, display }),
}

function printCommandTree(command, indent = '') {
  // Print the current command's tag
  console.log(indent + '├── ' + command.tag);

  // Increase indentation for child commands
  const childIndent = indent + '│   ';

  // If the command has a 'commander' field, print it as a child
  if (command.state?.commander) {
    printCommandTree(command.state.commander, childIndent);
  }

  // If the command has a 'currentCommand' field, print it as the first child
  if (command.state?.currentCommand) {
    printCommandTree(command.state.currentCommand, childIndent);
  }

  // If the command has 'commands' field, iterate and print each as a child
  if (command.state?.commands) {
    command.state.commands.forEach((cmd, index, array) => {
      // For the last command in the list, use a different prefix to indicate it's the last child
      if (index === array.length - 1) {
        console.log(childIndent.replace('│   ', '└── ') + cmd.tag);
      } else {
        printCommandTree(cmd, childIndent);
      }
    });
  }
}




// Exports the main functionalities of the module, making them available for use elsewhere in the application.
export default { create: SimpleCommand.create, commander: WithCommander.create, update, printCommandTree }
