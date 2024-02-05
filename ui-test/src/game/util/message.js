/* eslint-disable no-console */

const config = {
  log: true,
  event: false,
  warn: true,
  error: true,
}

const send = (...args) => log(...args)

const log = (text, ...args) => {
  if (config.log) {
    if (typeof document !== 'undefined') {
      console.log(`Log: ${text}`, ...args)
      const logElement = document.querySelector('#log')
      if (logElement) {
        logElement.innerHTML = text
      }
    }
  }
}

const warn = (...args) => {
  if (config.warn) {
    console.warn(...args)
  }
}

const error = (...args) => {
  if (config.error) {
    console.error(...args)
  }
}

const event = (text, args) => {
  if (config.event) {
    console.log(text, args)
  }
}

export default { send, log, event, warn, error }
