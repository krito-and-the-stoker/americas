import { createSignal, onCleanup } from 'solid-js'

import Util from 'util/util'
import Binding from 'util/binding'


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

function chain(listenerNoInput, listenerWithInput) {
  if (Array.isArray(listenerNoInput)) {
    return listenerNoInput.map(l => chain(l, listenerWithInput))
  }

  if (Array.isArray(listenerWithInput)) {
    return listenerWithInput.map(k => chain(listenerNoInput, k))
  }

  // the chaining creates a listener without input
  return fn => listenerNoInput(value => value && listenerWithInput(value, fn))
}

function bind(entity, listenerWithInput) {
  return listenerWithInput.bind(null, entity)
}

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


export default {
  create,
  map,
  chain,
}
