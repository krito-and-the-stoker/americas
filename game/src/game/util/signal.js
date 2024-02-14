import { createSignal, onCleanup } from 'solid-js'

import Util from 'util/util'
import Binding from 'util/binding'


function create(listener) {
  if (Array.isArray(listener)) {
    return listener.map(create)
  }

  const [signal, setSignal] = createSignal(undefined, { equals: false })
  const cleanup = listener(value => {
    setSignal(value)
  })

  onCleanup(cleanup)


  return signal
}

function chain(listener, listenerWithInput) {
  if (Array.isArray(listener)) {
    return listener.map(l => chain(l, listenerWithInput))
  }

  if (Array.isArray(listenerWithInput)) {
    return listenerWithInput.map(i => chain(listener, i))
  }

  return fn => listener(value => value && listenerWithInput(value, fn))
}

function bind(entity, listener) {
  return listener.bind(null, entity)
}

function map(listener, mapping) {
  if (Array.isArray(listener)) {
    return listener.map(l => map(l, mapping))
  }

  if (Array.isArray(mapping)) {
    return mapping.map(m => map(listener, m))
  }

  // There are two call signatures of listeners:
  // 1. listener(fn) // no argument
  // 2. listener(entity, fn) // with argument
  return (arg0, arg1) => Util.isFunction(arg0)
    ? listener(Binding.map(mapping, arg0))
    : listener(arg0, Binding.map(mapping, arg1))
}


// let's see...
function createEntity(entity, listeners) {
  return Object.fromEntries(
    Object.entries(listeners)
      .map(([key, listener]) => ([key, createAt(key, listener)]))
    )
}

export default {
  create,
  map,
  chain,
}
