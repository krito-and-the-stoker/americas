import { createSignal, onCleanup } from 'solid-js'

import Util from 'util/util'
import Binding from 'util/binding'
import Message from 'util/message'


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


function allowNoInput(listenerMaybeInput) {
  return (arg0, arg1) => {
    if (Util.isFunction(arg0)) {
      return listenerMaybeInput(null, arg0)
    }

    return listenerMaybeInput(arg0, arg1)
  }
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

  onCleanup(() => Util.execute(cleanup, true))

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
    ? listenerMaybeInput(value => listenerWithInput(value, arg0))
    : listenerMaybeInput(arg0, value => listenerWithInput(value, arg1))
})



// Acts as a pass through listener for chaining:
// Sometimes we want to chain a signal with multiple things,
// and still get back the unchained result.
// Example:
// [data, ...] = Signal.chain(Hover.listen.data, [Signal.through, Signal.select(...)])
function through(value, resolve) {
  return resolve(value)
}

const emit = (value) => {
  return allowNoInput((_, fn) => fn(value))
}

function source(listenerNoInput) {
  return (value, resolve) => listenerNoInput(resolve)
}


const isEqualBasic = (a, b) => a === b
const selectSimple = expand(mapping => {
  return (value, resolve) => {
    if (Util.isFunction(value)) {
      console.error('Signal.select expects input, none given, mapping bypassed.')
      return value()
    }

    return resolve(value !== undefined ? mapping(value) : value)
  }
})


const equality = (equals = isEqualBasic) => {
  let lastValue

  const rememberLastValue = value => final => {
    if (final) {
      lastValue = undefined
    } else {
      lastValue = value
    }
  }

  return (value, resolve) => {
    if (!equals || !equals(lastValue, value)) {
      return [
        rememberLastValue(value),
        resolve(value),
      ]
    }
  }
}

const select = (mapping, equals = isEqualBasic) => chain(selectSimple(mapping), equality(equals))


// executes this function as a side effect
function effect(sideEffect) {
  return (arg0, arg1) => {    
    if (Util.isFunction(arg0)) {
      return [
        sideEffect(),
        arg0(),
      ]
    }

    return [
      sideEffect(arg0),
      arg1(arg0),
    ]
  }
}

// awaits the function given
const awaitFnSimple = expand(asyncFunction => {
  return allowNoInput((value, resolve) => {
    let nextCleanup = null
    let shouldResolve = true
    const cleanup = final => {
      Util.execute(nextCleanup, final)
      nextCleanup = null
      shouldResolve = false
    }

    asyncFunction(value).then(result => {
      if (shouldResolve) {
        nextCleanup = resolve(result)
      }
    }).catch(e => {
      if (shouldResolve) {
        Message.signal.error(e)
        nextCleanup = resolve(undefined)
      }
    })

    return cleanup
  })
})

const awaitFn = (asyncFn, equals = isEqualBasic) => chain(equality(equals), awaitFnSimple(asyncFn))

// log the signal at any point
const log = effect(value => console.log('Signal.log:', value))

// executes a listener onto each value of an array
// For example:
// Signal.chain(
//   Signal.emit([1, 2, 3])
//   Signal.each(
//     Signal.select(number => number * 2)
//   ),
//   Signal.log // [2, 4, 6]
// )
const each = passArgumentsToChain(listenerWithInput => {
  return (input, resolve) => {
    const values = []
    let updateReady = false
    let pendingCleanup = null

    const cleanup = final => {
      Util.execute(pendingCleanup, final)
      pendingCleanup = null
    }      

    const updateItem = (value, i) => {
      cleanup()
      values[i] = value

      if (!updateReady) {
        return
      }

      return resolve(values.filter(x => x !== undefined && x !== null))
    }

    const unsubscribe = input.map((item, i) => listenerWithInput(item, value => updateItem(value, i)))
    updateReady = true
    pendingCleanup = resolve(values.filter(x => x !== undefined && x !== null))

    return [unsubscribe, cleanup]
  }
})


// combines an array or object one level deep into a single signal
// Example:
// Signal.combine([
//   Signal.emit(1),
//   Signal.emit(2),
// ])
// -> [1, 2]
const combine = passArgumentsToChain(listenersWithInput => {
  if (Array.isArray(listenersWithInput)) {
    return allowNoInput((input, resolve) => {
      const values = []
      let updateReady = false
      let pendingCleanup = null

      const cleanup = final => {
        Util.execute(pendingCleanup, final)
        pendingCleanup = null
      }

      const updateItem = (value, i) => {
        cleanup()
        values[i] = value

        if (!updateReady) {
          return
        }

        return resolve(values)
      }

      const unsubscribe = listenersWithInput.map((listener, i) => listener(input, value => updateItem(value, i)))
      updateReady = true
      pendingCleanup = resolve(values)

      return [unsubscribe, cleanup]
    })
  }

  if (isObject(listenersWithInput)) {
    return allowNoInput((input, resolve) => {
      const values = {}
      let updateReady = false
      let pendingCleanup = null

      const cleanup = final => {
        Util.execute(pendingCleanup, final)
        pendingCleanup = null
      }

      const updateItem = (value, key) => {
        cleanup()
        values[key] = value

        if (!updateReady) {
          return
        }

        return resolve(values)
      }

      const unsubscribe = Object.entries(listenersWithInput)
        .map(([key, listener]) => listener(input, value => updateItem(value, key)))
      updateReady = true
      pendingCleanup = resolve(values)

      return [unsubscribe, cleanup]
    })
  }


  console.error('Signal.combine expected array or object of signals, passed')
  return listenersWithInput
})

const sidechain = (...args) => source(chain(...args))

// create a basic listener object with initial value passed in
// myNumber = Signal.basic(5)
// myNumber.listen(value => console.log(value)) // prints 5
// myNumber.update(10) // prints 10
// Can be used in signal chain
// Signal.create(myNumber.listen, Signal.log) // will log whenever the number is updated
const basic = initialValue => {
  let currentValue = initialValue
  let listeners = []

  const listen = fn => {
    const cleanup = fn(currentValue)

    listeners.push({
      cleanup,
      fn
    })
  }

  const update = newValue => {
    currentValue = newValue
    listeners.forEach(listener => {
      Util.execute(listener.cleanup)
      listener.cleanup = listener.fn(currentValue)
    })
  }

  return {
    listen,
    update,
    get value() {
      return currentValue
    }
  }
}

const state = expand(passArgumentsToChain(listenerNoInput => {
  let isActive = true
  let signal = basic()

  let currentValue

  const stateObject = {
    get value() {
      if (!isActive) {
        Message.signal.warn('Signal.state: state is not active', currentValue)
      }
      return currentValue
    },
    get listen() {
      if (!isActive) {
        Message.signal.warn('Signal.state: state is not active', currentValue)
      }
      return signal.listen
    },
    get cleanup() {
      if (!isActive) {
        Message.signal.warn('Signal.state: state is not active', currentValue)
      }
      return [cleanup, () => {
        cleanup = null
        isActive = false
      }]
    },
  }

  let cleanup = listenerNoInput(value => {
    currentValue = value
    signal.update(value)
  })

  return stateObject
}))


export default {
  create,
  emit,
  effect,
  through,
  select,
  chain,
  sidechain,
  each,
  combine,
  source,
  log,
  basic,
  state,
  await: awaitFn,
}
