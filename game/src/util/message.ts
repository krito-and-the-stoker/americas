const level = {
  info: true,
  log: true,
  warn: true,
  error: true,
} as const;

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
} as const;

// Extract keys from `level` and `domains` objects where the value is `true`
type Level = keyof typeof level;
type Domain = keyof typeof domains;


const print = (level: Level, domain: Domain, ...args: any[]) => {
  if (typeof document !== 'undefined') {
    const method = console[level as keyof Console] as Function;
    method?.(`${level} ${domain}:`, ...args);
    // TODO: Display a few things in the intro log
    // const logElement = document.querySelector('#log')
    // if (logElement) {
    //   logElement.innerHTML = text
    // }
  }
}

const info = (domain: Domain) => (...args: any[]) => {
  if (level.info) {
    print('info', domain, ...args)
  }
}

const log = (domain: Domain) => (...args: any[]) => {
  if (level.log) {
    print('log', domain, ...args)
  }
}

const warn = (domain: Domain) => (...args: any[]) => {
  if (level.warn) {
    print('warn', domain, ...args)
  }
}

const error = (domain: Domain) => (...args: any[]) => {
  print('error', domain, ...args)
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
