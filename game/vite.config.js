import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
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
    [dir]: path.resolve(__dirname, `./src/game/${dir}`),
  }))
  .reduce((all, one) => ({ ...all, ...one }), {})

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      version: path.resolve(__dirname, './src/version'),
      ...aliases,
    },
  },
  server: {
    proxy: {
      '/api': 'http://event-tracker:8080',
      '/images': 'http://assets:3000',
      '/styles': 'http://assets:3000',
    },
  },
})
