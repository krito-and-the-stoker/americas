import type { Function2 } from 'util/types'
import type { Listen } from 'util/signal/types'

import { createState } from 'util/signal/tools'


export function collect<V>(keep: Function2<V, V[], V[]>): Listen<V[], V> {
  const state = createState(() => ({ collection: [] as V[] }))

  return (next, parameter) => {
    const privateState = state.read()
    privateState.collection = keep(parameter, privateState.collection)


    return [
      state.write(),
      next(privateState.collection)
    ]
  }
}


export const buffer = <V>(size: number) => collect<V>((value, collection) => {
  collection.push(value)
  if (collection.length > size) {
    return [value]
  }
  return collection
})

export const window = <V>(size: number) => collect<V>((value, collection) => {
  collection.push(value)
  if (collection.length > size) {
    collection = collection.slice(-size)
  }
  return collection
})
