const level = {
  info: true,
  log: true,
  warn: true,
  error: true,
} as const;

const domains = {
  event: 'warn',
  command: 'warn',
  colony: 'warn',
  europe: 'warn',
  unit: 'warn',
  natives: 'warn',
  initialize: 'warn',
  tile: 'warn',
  owner: 'warn',
  record: 'warn',
  util: 'warn',
  tutorial: 'warn',
  templates: 'warn',
  savegame: 'warn',
  tracking: 'warn',
  signal: 'warn',
  cache: 'warn',
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

const levels = ['info', 'log', 'warn', 'error']
const isEnabled = (level: string, base: string) => levels.indexOf(level) >= levels.indexOf(base)
const domainFunctions = Object.fromEntries(Object.entries(domains).map(([domain, level]) => {
  const functions = {
    info: isEnabled(level, 'info') ? info(domain as Domain) : emptyFn,
    log: isEnabled(level, 'log') ? log(domain as Domain) : emptyFn,
    warn: isEnabled(level, 'warn') ? warn(domain as Domain) : emptyFn,
    error: isEnabled(level, 'error') ? error(domain as Domain) : emptyFn,
  }

  return [domain as Domain, functions]
}))


export default domainFunctions
