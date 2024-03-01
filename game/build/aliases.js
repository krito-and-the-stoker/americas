import path from 'path'

const directories = [
  'ai',
  'command',
  'data',
  'entity',
  'entries',
  'input',
  'interaction',
  'intro',
  'maps',
  'render',
  'task',
  'timeline',
  'util',
  'view',
]
const aliases = directories
  .map(dir => ({
    [dir]: path.resolve(__dirname, `../src/${dir}`),
  }))
  .reduce((all, one) => ({ ...all, ...one }), {})

export default aliases
