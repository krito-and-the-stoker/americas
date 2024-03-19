import type { Function2 } from 'util/types'
import type { Chain } from 'util/signal/types'



export function collect<V1, V2>(keep: Function2<V2, V1, V2>, initial: V2): Chain<V1, V2> {
  return (next, parameter, context) => {
    if (!context.isInitialized) {
      context.collection = initial
      context.isInitialized = true
    }
    context.collection = keep(context.collection, parameter)

    return next(context.collection)
  }
}


export const buffer = <V>(size: number) => collect<V, V[]>((collection, value) => {
  collection.push(value)
  if (collection.length > size) {
    return [value]
  }
  return collection
}, [])

export const window = <V>(size: number) => collect<V, V[]>((collection, value) => {
  collection.push(value)
  if (collection.length > size) {
    collection = collection.slice(-size)
  }
  return collection
}, [])
