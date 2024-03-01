/* eslint-disable no-console */

const level = {
  info: true,
  log: true,
  warn: true,
}

const domains = {
  event: false,
  command: false,
  colony: true,
  europe: true,
  unit: true,
  natives: true,
  initialize: false,
  tile: true,
  owner: true,
  record: true,
  util: true,
  tutorial: true,
  templates: false,
  savegame: true,
  tracking: false,
  signal: true
}

const print = (level, domain, ...args) => {
  if (typeof document !== 'undefined') {
    console[level.toLowerCase()](`${level} ${domain}:`, ...args)
    // TODO: Display a few things in the intro log
    // const logElement = document.querySelector('#log')
    // if (logElement) {
    //   logElement.innerHTML = text
    // }
  }
}

const info = domain => (...args) => {
  if (level.info) {
    print('Info', domain, ...args)
  }
}

const log = domain => (...args) => {
  if (level.log) {
    print('Log', domain, ...args)
  }
}

const warn = domain => (...args) => {
  if (level.warn) {
    print('Warn', domain, ...args)
  }
}

const error = domain => (...args) => {
  print('Error', domain, ...args)
}


const emptyFn = () => {}

const domainFunctions = Object.fromEntries(Object.entries(domains).map(([domain, isEnabled]) => {
  const functions = isEnabled ? {
    info: info(domain),
    log: log(domain),
    warn: warn(domain),
    error: error(domain),
  } : {
    info: emptyFn,
    log: emptyFn,
    warn: emptyFn,
    error: error(domain),
  }

  return [domain, functions]
}))


export default domainFunctions
