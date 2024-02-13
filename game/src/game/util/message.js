/* eslint-disable no-console */

const level = {
  log: true,
  warn: true,
  error: true,
}

const domains = {
  event: true,
  command: true,
  colony: true,
  europe: true,
  unit: true,
  natives: true,
  initialize: true,
  tile: true,
  owner: true,
  record: true,
  util: true,
  tutorial: false,
  templates: true,
}

const print = (level, ...args) => {
  if (typeof document !== 'undefined') {
    console.log(`${level}:`, ...args)
    // const logElement = document.querySelector('#log')
    // if (logElement) {
    //   logElement.innerHTML = text
    // }
  }
}

const info = (...args) => {
  if (level.info) {
    print('info', ...args)
  }
}

const log = (...args) => {
  if (level.log) {
    print('log', ...args)
  }
}

const warn = (...args) => {
  if (level.warn) {
    print('warn', ...args)
  }
}

const error = (...args) => {
  if (level.error) {
    print('error', ...args)
  }
}


const emptyFn = () => {}

const domainFunctions = Object.fromEntries(Object.entries(domains).map(([key, isEnabled]) => {
  const functions = isEnabled ? {
    log,
    warn,
    info,
    error,
  } : {
    log: emptyFn,
    warn: emptyFn,
    info: emptyFn,
    error: emptyFn,
  }

  return [key, functions]
}))

console.log(domainFunctions)

export default domainFunctions
