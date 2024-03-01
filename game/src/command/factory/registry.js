import Unload from 'command/unload'

// Defines a registry for commands to manage dependencies and avoid circular import issues.
const CommandRegistry = {
  Unload
}

const get = key => {
  if (!CommandRegistry[key]) {
    console.error('Command Registry does not have ', key, 'Choose one of those', CommandRegistry)
  }

  return CommandRegistry[key]
}

const add = (key, Command) => {
  CommandRegistry[key] = Command
}

export default {
  get,
  add
}
