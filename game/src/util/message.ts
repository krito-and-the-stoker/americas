const level = {
  info: true,
  log: true,
  warn: true,
  error: true,
} as const;

const domains = {
  event: false,
  command: false,
  colony: false,
  europe: false,
  unit: false,
  natives: false,
  initialize: false,
  tile: false,
  owner: false,
  record: false,
  util: false,
  tutorial: false,
  templates: false,
  savegame: false,
  tracking: false,
  signal: false,
  cache: false,
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
    info: info(domain as Domain),
    log: log(domain as Domain),
    warn: warn(domain as Domain),
    error: error(domain as Domain),
  } : {
    info: emptyFn,
    log: emptyFn,
    warn: emptyFn,
    error: error(domain as Domain),
  }

  return [domain as Domain, functions]
}))


export default domainFunctions
