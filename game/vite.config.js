import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import path from 'path'
import writeDateToVersion from './build/write-date-to-version'
import aliases from './build/aliases'

export default defineConfig({
  plugins: [solid(), writeDateToVersion()],
  resolve: {
    alias: {
      version: path.resolve(__dirname, './src/version'),
      ui: path.resolve(__dirname, 'src/ui'),
      ...aliases,
    },
  },
  server: {
    proxy: {
      '/api': 'http://event-tracker:8080',
      '/images': 'http://assets:3000',
      '/styles': 'http://assets:3000',
      '/templates': 'http://assets:3000',
    },
  },
})
