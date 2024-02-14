import { createSignal, onCleanup } from 'solid-js'

import Binding from 'util/binding'


function create(listener) {
  const [signal, setSignal] = createSignal(undefined, { equals: false })
  const cleanup = listener(value => {
    setSignal(value)
  })

  onCleanup(cleanup)


  return signal
}

function concat(listener, listenerWithInput) {
  return fn => listener(value => value && listenerWithInput(value, fn))
}

function bind(entity, listener) {
  return listener.bind(null, entity)
}

function map(listener, mapping) {
  return fn => listener(Binding.map(mapping, fn))
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
  concat,
}
