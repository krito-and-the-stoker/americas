import { RingBuffer, default as createRingBuffer } from './RingBuffer'

const CONFIG_DEFAULTS = {
  // essentially localhost
  'default': {
    maxLogEntries: 10000,
    alwaysPrintWarnings: true
  },
  'develop.play-americas.com': {
    maxLogEntries: 0,
    alwaysPrintWarnings: true
  },
  'www.play-americas.com': {
    maxLogEntries: 0,
    alwaysPrintWarnings: false
  }
}

const readConfigDefaults = (key) => {
  if (CONFIG_DEFAULTS[window.location.host]) {
    return CONFIG_DEFAULTS[window.location.host][key]
  }

  return CONFIG_DEFAULTS.default[key]
}

const createLogger = () => {
  try {
    Error.stackTraceLimit = Math.max(Error.stackTraceLimit || 0, 250);
  } catch (e) {}

  const readFromStorage = (key, fallback) => {
    if (window.localStorage && window.localStorage[key]) {
      try {
        return JSON.parse(window.localStorage[key])
      } catch (e) {}
    }

    return fallback
  }


  const writeToStorage = (key, filters) => {
    if (window.localStorage?.setItem) {
      window.localStorage.setItem(key, JSON.stringify(filters))
    }
  }

  const config = (newConfig) => {
    if (newConfig?.maxLogEntries) {
      setMaxLogEntries(newConfig.maxLogEntries)
    }
    if (newConfig?.alwaysPrintWarnings) {
      setAlwaysPrintWarnings(newConfig?.alwaysPrintWarnings)
    }

    return {
      maxLogEntries,
      alwaysPrintWarnings
    }
  }

  let maxLogEntries = readFromStorage('LoggerMaxEntries', readConfigDefaults('maxLogEntries'))
  let alwaysPrintWarnings = readFromStorage('AlwaysPrintWarnings', readConfigDefaults('alwaysPrintWarnings'))
  let logs = createRingBuffer(maxLogEntries)
  let printFilters = readFromStorage('LoggerPrintFilters', [{ minLevel: 'error' }])
  const saveFilters = []

  const setMaxLogEntries = (entries) => {
    writeToStorage('LoggerMaxEntries', entries)
    console.log('[Logger] Set maxLogEntries to', entries, '\nThis will only take effect after page reload. Use Logger.reset() to reset the loggers and clear all persistent changes.')
  }
  const setAlwaysPrintWarnings = (newValue) => {
    writeToStorage('AlwaysPrintWarnings', newValue)
    alwaysPrintWarnings = newValue
    console.log('[Logger] Set alwaysPrintWarnings to', newValue, '\nEffective immediately.')
  }
  const getMaxLogEntries = () => maxLogEntries
  const clearSettings = () => {
    if (window.localStorage) {
      window.localStorage.removeItem('LoggerMaxEntries')
      window.localStorage.removeItem('AlwaysPrintWarnings')
      window.localStorage.removeItem('LoggerPrintFilters')
    }
  }
  const reset = () => {
    clearSettings()
    window.Logger = createLogger()
  }

  const createLog = (partial) => ({
    ...partial,
    index: logs.virtualLength + 1,
    trace: ['warn', 'error'].includes(partial.level)
      && (new Error()?.stack ?? '')
        .split('\n')
        .splice(1)
        .filter(
          line => !line.match(/node_modules/) && !line.match(/\/Logger\.ts/)
        )
        .join('\n')
  })

  const handleLog = (level) => (...args) => {
    if (maxLogEntries === 0 && level !== 'error' && printFilters.length === 1 && printFilters[0]?.minLevel === 'error' && !alwaysPrintWarnings) {
      return
    }

    const log = createLog({ level, args })
    const shouldPrintLog = level === 'error'
      || (level === 'warn' && alwaysPrintWarnings)
      || applyAllFilters(printFilters, log)

    if (shouldPrintLog) {
      printLog(log, level === 'error')
    }

    if (applyAllFilters(saveFilters, log)) {
      logs.push(log)
    }
  }

  const isArray = (something) => Array.isArray(something)
  const matchNoCase = (str, filter) => !!str.toLowerCase().match(filter.toLowerCase())
  const applyMatchFilter = (filter, log) => {
    return log.args.some(arg => {
      if (typeof arg === 'string') {
        return matchNoCase(arg, `${filter}`)
      }
      if (arg && typeof arg === 'object') {
        return Object.keys(arg).some(key => matchNoCase(key, `${filter}`))
          || Object.values(arg).some(value => {
            if (typeof value === 'string') {
              return matchNoCase(value, `${filter}`)
            }

            return false
          })
      }

      return false
    }) || (log.trace && matchNoCase(log.trace, `${filter}`))
      || matchNoCase(`#${log.index}`, `${filter}`)
  }
  const levelToNumber = (level) => ({
    'info': 1,
    'log': 2,
    'warn': 3,
    'error': 4
  })[level] ?? (console.warn('[Logger] Unknown log level:', level) && 0)
  const applyLevelFilter = (filter, log) =>
    levelToNumber(filter) === levelToNumber(log.level)
  const applyMinLevelFilter = (filter, log) =>
    levelToNumber(filter) <= levelToNumber(log.level)
  const applyMaxLevelFilter = (filter, log) =>
    levelToNumber(filter) >= levelToNumber(log.level)
  const applyNotFilter = (filter, log) => {
    return !applyFilter(filter, log)
  }

  const applyFilterSingleOrArray = (filters, log, applyFilter, operator = (a, b) => a && b) => {
    if (Array.isArray(filters)) {
      return filters.reduce((result, filter) => operator(result, applyFilter(filter, log)), !operator(true, false))
    }

    return applyFilter(filters, log)
  }
  const applyFilter = (filter, log) => {
    if (typeof filter === 'object' && !Array.isArray(filter)) {
      let isMatch = true

      if (filter.match) {
        isMatch = isMatch && applyFilterSingleOrArray(filter.match, log, applyMatchFilter)
      }
      if (filter.any) {
        isMatch = isMatch && applyFilterSingleOrArray(filter.any, log, applyFilter, (a, b) => a || b)
      }
      if (filter.level) {
        isMatch = isMatch && applyFilterSingleOrArray(filter.level, log, applyLevelFilter, (a, b) => a || b)
      }
      if (filter.minLevel) {
        isMatch = isMatch && applyMinLevelFilter(filter.minLevel, log)
      }
      if (filter.maxLevel) {
        isMatch = isMatch && applyMaxLevelFilter(filter.maxLevel, log)
      }
      if (filter.not) {
        isMatch = isMatch && applyFilterSingleOrArray(filter.not, log, applyNotFilter, (a, b) => a || b)
      }

      return isMatch
    }

    if (typeof filter === 'string' || typeof filter === 'number') {
      return applyMatchFilter(filter, log)
    }

    console.warn('[Logger] Filter type not found:', filter)
    return true
  }
  const applyAllFilters = (filters, log) =>
    filters.every(filter => applyFilter(filter, log))


  const filterLogs = (logs, option) => {
    let result = logs
    if (option.head) {
      result = result.slice(0, option.head)
    }
    if (option.tail) {
      result = result.slice(result.length - option.tail)
    }

    return result
  }

  const printLogs = (logs, ...options) => {
    options.reduce(filterLogs, logs)
      .forEach(log => printLog(log))
  }
  const printLog = (log, printTrace = true) => {  
    if (printTrace && log.trace) {
      console[log.level](`#${log.index}`, ...log.args, '\n' + log.trace);
    } else {
      console[log.level](`#${log.index}`, ...log.args);
    }
  }

  const addFilter = (...filters) => {
    setPrintFilter(...printFilters, ...filters)
  }
  const setPrintFilter = (...filters) => {
    printFilters = filters
    writeToStorage('LoggerPrintFilters', filters)
  }

  const filtersFromParams = (params) => {
    return params.map(param =>
      (typeof param === 'string' || Array.isArray(param)
        ? param
        : {
          match: param.match,
          any: param.any,
          not: param.not,
          level: param.level,
          minLevel: param.minLevel,
          maxLevel: param.maxLevel,
        }))
  }
  const optionsFromParams = (params) => {
    return params.map(param =>
      (typeof param === 'string' || Array.isArray(param)
        ? {}
        : {
        head: param.head,
        tail: param.tail
      }))
  }

  const printBuffer = (...params) => {
    const filters = filtersFromParams(params)
    const options = optionsFromParams(params)

    printLogs(logs.read().filter(log => applyAllFilters(filters, log)), ...options)
  }
  const print = (...params) => {
    printBuffer(...params)
    const filters = filtersFromParams(params)
    setPrintFilter(...filters)
  }

  handleLog('info')('[Logger] created', { ...config() })

  return {
    info: handleLog('info'),
    log: handleLog('log'),
    warn: handleLog('warn'),
    error: handleLog('error'),
    print,
    search: printBuffer,
    listen: setPrintFilter,
    stop: () => setPrintFilter({ minLevel: 'error' }),
    reset,
    addFilter,
    config,
  }
}

if (!window.Logger) {
  window.Logger = createLogger()
}

export default window.Logger
