// Importing necessary modules and components for command handling, utilities, and messaging.
import Binding from 'util/binding'

import WithCommander from './withCommander'
import SimpleCommand from './simpleCommand'

// Utility functions for updating command states, such as information and display properties.
const update = {
  info: (state, info) => Binding.update(state, 'info', info),
  display: (state, display) => Binding.update(state, 'info', { ...state.info, display }),
}

// Exports the main functionalities of the module, making them available for use elsewhere in the application.
export default { create: SimpleCommand.create, commander: WithCommander.create, update }
