import { createSignal, onCleanup } from 'solid-js'

import Util from 'util/util'
import Binding from 'util/binding'


// Create a signal that can be used with solid
// Expects a listener with no input
// Example:
// screen = Signal.create(Foreground.listen.screen)
// supports arrays:
// [screen, data] = Signal.create([Foreground.listen.screen, Hover.listen.data])
function create(listenerNoInput) {
  if (Array.isArray(listenerNoInput)) {
    return listenerNoInput.map(create)
  }

  const [signal, setSignal] = createSignal(undefined, { equals: false })
  const cleanup = listenerNoInput(value => {
    setSignal(value)
  })

  onCleanup(cleanup)


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
  if (args.length > 1) {
    listenerWithInput = chain(args[0], args[1])
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

  return (arg0, arg1) => Util.isFunction(arg0)
    ? listenerMaybeInput(value => value && listenerWithInput(value, arg0))
    : listenerMaybeInput(arg0, value => value && listenerWithInput(value, arg1))
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
// Signal.map(Colonist.listen.unit, unit => unit?.equipment)
// Will listen to the unit of a colonist and map the value to its equipment
// Important: This will not create a listener to the equipment.
// For that we need a chain:
// Signal.chain(
//   Signal.map(Colonist.listen.unit, unit => unit?.equipment),
//   Storage.listen
// )
//
function map(listenerMaybeInput, mapping) {
  if (Array.isArray(listenerMaybeInput)) {
    return listenerMaybeInput.map(l => map(l, mapping))
  }

  if (Array.isArray(mapping)) {
    return mapping.map(m => map(listenerMaybeInput, m))
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
// [data, ...] = Signal.chain(Hover.listen.data, [Signal.through, Signal.map(...)])
function through(value, fn) {
  return fn(value)
}

export default {
  create,
  bind,
  through,
  map,
  chain,
}
