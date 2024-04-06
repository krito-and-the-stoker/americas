import type { PrimitiveSignal, CleanupExec } from 'signal-chain'
import $ from 'signal-chain'
import type { Function1, Function2 } from 'util/types'

$.config({
  update: 'timeout',
  batch: true
})


const listeners = new Map<Object, PrimitiveSignal<unknown>>()
const listen = <O extends Object, Key extends keyof O>(instance: O, key: Key | null | undefined, fn: Function1<O[Key], CleanupExec>) => {
  if (!instance) {
    // @ts-ignore
    return fn(undefined)
  }
  if (key === null || key === undefined) {
    if (!listeners.get(instance)) {
      listeners.set(instance, $.primitive.create(instance) as PrimitiveSignal<unknown>)
    }
    return listeners.get(instance)!.listen(fn as Function1<unknown, CleanupExec>)
  }

  return $.listen.key<O, Key>(key)(fn, instance)
}

const update = <O extends Object, Key extends keyof O>(instance: O, key: Key | null | undefined, value: O[Key]) => {
  if (key === null || key === undefined) {
    if (listeners.get(instance)) {
      const primitive = listeners.get(instance)!
      if (value !== undefined) {
        if (primitive.value === value) {
          return
        }
        primitive.value = value
      } else {
        primitive.value = primitive.value
      }
    }

    return
  }
  if (value !== undefined) {
    if (instance[key] === value) {
      return
    }
    instance[key] = value
  } else {
    // trigger update
    instance[key] = instance[key]
  }
}

const stdEquality = <T>(a: T, b: T) => a === b
const map = <From, To>(mapping: Function1<From, To>, fn: Function1<To, CleanupExec>, _: Function2<To, To, boolean> = stdEquality) => {
  return (value: From) => fn(mapping(value))
}


export default {
  update,
  listen,
  map,
}