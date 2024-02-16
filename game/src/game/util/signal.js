import { createSignal, onCleanup } from 'solid-js'

import Util from 'util/util'
import Binding from 'util/binding'


// Create a signal that can be used with solid
// Expects a listener with no input
// Example:
// screen = Signal.create(Foreground.listen.screen)
// supports arrays:
// [screen, data] = Signal.create([Foreground.listen.screen, Hover.listen.data])
function create(...args) {
  let listenerNoInput
  if (args.length === 0) {
    return null
  }
  if (args.length === 1) {
    listenerNoInput = args[0]
  }
  if (args.length > 1) {
    // automatic chaining for multiple arguments
    listenerNoInput = chain(...args)
  }

  if (Array.isArray(listenerNoInput)) {
    return listenerNoInput.map(l => create(l))
  }

  const [signal, setSignal] = createSignal(undefined, { equals: false })
  const cleanup = listenerNoInput(value => {
    setSignal(value)
  })

  onCleanup(() => Util.execute(cleanup))


  return signal
}

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
function chain(listenerMaybeInput, ...args) {
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
  // resolve arrays
  if (Array.isArray(listenerMaybeInput)) {
    return listenerMaybeInput.map(l => chain(l, listenerWithInput))
  }

  if (Array.isArray(listenerWithInput)) {
    return listenerWithInput.map(k => chain(listenerMaybeInput, k))
  }

  if (!Util.isFunction(listenerMaybeInput)) {
    console.error('listenerMaybeInput is not a function, skipped:', listenerMaybeInput)
    return through
  }


  return (arg0, arg1) => Util.isFunction(arg0)
    ? listenerMaybeInput(value => (value || value === 0) && listenerWithInput(value, arg0))
    : listenerMaybeInput(arg0, value => (value || value === 0) && listenerWithInput(value, arg1))
}

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

// Maps the output of a listener to another value
// Example:
// Signal.select(Colonist.listen.unit, unit => unit?.equipment)
// Will listen to the unit of a colonist and map the value to its equipment
// Important: This will not create a listener to the equipment.
// For that we need a chain:
// Signal.chain(
//   Signal.select(Colonist.listen.unit, unit => unit?.equipment),
//   Storage.listen
// )
//
function select(listenerMaybeInput, mapping) {
  if (Array.isArray(listenerMaybeInput)) {
    return listenerMaybeInput.map(l => select(l, mapping))
  }

  if (Array.isArray(mapping)) {
    return mapping.map(m => select(listenerMaybeInput, m))
  }

  // There are two call signatures of listeners:
  // 1. listener(fn) // no input
  // 2. listener(entity, fn) // with input
  return (arg0, arg1) => Util.isFunction(arg0)
    ? listenerMaybeInput(Binding.map(mapping, arg0))
    : listenerMaybeInput(arg0, Binding.map(mapping, arg1))
}

// Acts as a pass through listener for chaining:
// Sometimes we want to chain a signal with multiple things,
// and still get back the unchained result.
// Example:
// [data, ...] = Signal.chain(Hover.listen.data, [Signal.through, Signal.select(...)])
function through(value, exec) {
  return exec(value)
}

function emit(value) {
  return exec => exec(value)
}


function niceSelect(mapping, equals) {
  if (Array.isArray(mapping)) {
    return mapping.map(m => select(m))
  }

  // if we ever have a problem with Binding.map, we can always go back here
  // return (value, exec) => {
  //   if (Util.isFunction(value)) {
  //     console.error('Signal.select expects input, none given, mapping bypassed.')
  //     return value()
  //   }
  //   return exec(mapping(value))
  // }
  // this does not make too much sense right now
  return (value, resolve) => Binding.map.bind(null, mapping)(resolve, equals)(value)
}

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

function reduce(reducer, initial) {
  return (values, resolve) => resolve(values.reduce(reducer, initial))
}

function each(listenerWithInput, resolver = x => x) {
  return (input, resolve) => {
    const values = []
    let oldValue
    let updateReady = false
    let pendingResolve
    const updateItem = (value, i) => {
      Util.execute(pendingResolve)
      values[i] = value

      if (!updateReady) {
        return
      }

      const newValue = resolver(values)
      if (newValue !== oldValue) {
        oldValue = newValue
        return resolve(newValue)
      }
    }

    const unsubscribe = input.map((item, i) => listenerWithInput(item, value => updateItem(value, i)))
    updateReady = true
    pendingResolve = resolve(resolver(values))

    return unsubscribe
  }
}

each('hallo', 'welt', 'cool')

export default {
  create,
  bind,
  log,
  emit,
  effect,
  through,
  select,
  niceSelect,
  chain,
  each,
}
