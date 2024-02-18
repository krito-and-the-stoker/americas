import { createSignal, onCleanup } from 'solid-js'

import Util from 'util/util'
import Binding from 'util/binding'


const passArgumentsToChain = fn => (...args) => fn(chain(...args))
function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
const expand = fn => (...args) => {
  for(const [pos, arg] of args.entries()) {
    if (Array.isArray(arg)) {
      const newArguments = [...args]

      return arg.map(a => {
        newArguments[pos] = a
        return expand(fn)(...newArguments)
      })
    }
    if (isObject(arg)) {
      const newArguments = [...args]
      return Object.fromEntries(
        Object.entries(arg).map(([key, value]) => {
          newArguments[pos] = value
          return [key, expand(fn)(...newArguments)]
        })
      )
    }
  }

  return fn(...args)
}


// Create a signal that can be used with solid
// Expects a listener with no input
// Example:
// screen = Signal.create(Foreground.listen.screen)
// supports arrays:
// [screen, data] = Signal.create([Foreground.listen.screen, Hover.listen.data])
const create = expand(passArgumentsToChain(listenerNoInput => {
  const [signal, setSignal] = createSignal(undefined, { equals: false })
  const cleanup = listenerNoInput(value => {
    setSignal(value)
  })

  onCleanup(() => Util.execute(cleanup))

  return signal
}))

// Chains two listeners together
// Example:
// Signal.chain(Colonist.listen.unit, Unit.listen.passengers)
// will create a listener that expects a unit as an argument,
// and will listen to the passengers of this unit.
// If the first listener of the chain expects no input,
// the result of the chain can be used to create a signal:
// Signal.create(Signal.chain(...))
// Allows long chains:
// Signal.chain(Unit.listen.vehicle, Unit.listen.tile, Tile.listen.colony)
// Will listen to the colony of the tile of the vehicle of a unit.
// This chain still needs a unit as input, because the Unit.listen.vehicle needs that
const chain = expand((listenerMaybeInput, ...args) => {
  // resolve multiple args
  let listenerWithInput
  if (args.length === 0) {
    return listenerMaybeInput
  }
  if (args.length > 1) {
    listenerWithInput = chain(args[0], ...args.slice(1))
  } else {
    listenerWithInput = args[0]
  }

  if (!Util.isFunction(listenerMaybeInput)) {
    console.error('Signal.chain: listenerMaybeInput is not a function, skipped', listenerMaybeInput)
    return through
  }


  return (arg0, arg1) => Util.isFunction(arg0)
    ? listenerMaybeInput(value => (value !== undefined && value !== null) ? listenerWithInput(value, arg0) : arg0())
    : listenerMaybeInput(arg0, value => (value !== undefined && value !== null) ? listenerWithInput(value, arg1) : arg1())
})

// Allows to statically bind an input
// Example:
// Signal.bind(colonist, Colonist.listen.unit)
// Will listen to the unit of a colonist.
//
// All functions support signal splitting using arrays:
// bind(colonist, [Colonist.listen.unit, Colonist.listen.expert])
// will return an array of bound listeners,
// that can be fed everywhere a listener is expected
function bind(entity, listenerWithInput) {
  if (Array.isArray(listenerWithInput)) {
    return listenerWithInput.map(l => bind(entity, l))
  }
  return listenerWithInput.bind(null, entity)
}

// Acts as a pass through listener for chaining:
// Sometimes we want to chain a signal with multiple things,
// and still get back the unchained result.
// Example:
// [data, ...] = Signal.chain(Hover.listen.data, [Signal.through, Signal.select(...)])
function through(value, resolve) {
  return resolve(value)
}

function emit(value) {
  return (arg0, arg1) => {
    if (Util.isFunction(arg0)) {
      arg0(value)
    } else {
      arg1(value)
    }
  }
}

function source(listenerNoInput) {
  return (value, resolve) => listenerNoInput(resolve)
}


const select = expand(mapping => {
  return (value, resolve) => {
    if (Util.isFunction(value)) {
      console.error('Signal.select expects input, none given, mapping bypassed.')
      return value()
    }

    return resolve(mapping(value))
  }
})

function effect(effect) {
  return (arg0, arg1) => {    
    if (Util.isFunction(arg0)) {
      effect()
      return arg0()
    }

    effect(arg0)
    return arg1(arg0)
  }
}

const log = effect(value => console.log('Signal.log:', value))

const each = passArgumentsToChain(listenerWithInput => {
  return (input, resolve) => {
    const values = []
    let updateReady = false
    let pendingResolve = null

    const updateItem = (value, i) => {
      Util.execute(pendingResolve)
      values[i] = value

      if (!updateReady) {
        return
      }

      return resolve(values.filter(x => x !== undefined && x !== null))
    }

    const unsubscribe = input.map((item, i) => listenerWithInput(item, value => updateItem(value, i)))
    updateReady = true
    pendingResolve = resolve(values.filter(x => x !== undefined && x !== null))

    return unsubscribe
  }
})

const combine = passArgumentsToChain(listenersWithInput => {
  if (Array.isArray(listenersWithInput)) {
    return (input, resolve) => {
      const values = []
      let updateReady = false
      let pendingResolve = null

      const updateItem = (value, i) => {
        Util.execute(pendingResolve)
        values[i] = value

        if (!updateReady) {
          return
        }

        return resolve(values)
      }

      const unsubscribe = listenersWithInput.map((listener, i) => listener(input, value => updateItem(value, i)))
      updateReady = true
      pendingResolve = resolve(values)

      return unsubscribe
    }
  }

  if (isObject(listenersWithInput)) {
    return (input, resolve) => {
      const values = {}
      let updateReady = false
      let pendingResolve = null

      const updateItem = (value, key) => {
        Util.execute(pendingResolve)
        values[key] = value

        if (!updateReady) {
          return
        }

        return resolve(values)
      }

      const unsubscribe = Object.entries(listenersWithInput)
        .map(([key, listener]) => listener(input, value => updateItem(value, key)))
      updateReady = true
      pendingResolve = resolve(values)

      return unsubscribe
    }
  }


  console.error('Signal.combine expected array or object of signals, passed')
  return listenersWithInput
})

const sidechain = (...args) => source(chain(...args))
const preselect = (...args) => combine(select(...args))

export default {
  create,
  bind,
  emit,
  effect,
  through,
  select,
  preselect,
  chain,
  sidechain,
  each,
  combine,
  source,
  log,
}
