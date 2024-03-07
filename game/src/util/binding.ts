import { BasicSignal, CleanupExec } from "./signal/types"
import { objectListener } from "./signal/object"
import type { Function1, Function2 } from 'util/types'
import { primitive } from "./signal/primitive"

const listeners = new Map<Object, BasicSignal<unknown>>()
const listen = <O extends Object, Key extends keyof O>(instance: O, key: Key | null | undefined, fn: Function1<O[Key], CleanupExec>) => {
  if (!instance) {
    // @ts-ignore
    return fn(undefined)
  }
  if (key === null || key === undefined) {
    if (!listeners.get(instance)) {
      listeners.set(instance, primitive(instance) as BasicSignal<unknown>)
    }
    return listeners.get(instance)!.listen(fn as Function1<unknown, CleanupExec>)
  }
  return objectListener(instance, key)(fn)
}

const update = <O extends Object, Key extends keyof O>(instance: O, key: Key | null | undefined, value: O[Key]) => {
  if (key === null || key === undefined) {
    if (listeners.get(instance)) {
      if (value === undefined) {
        const primitive = listeners.get(instance)!
        primitive.update(primitive.value)
      } else {
        listeners.get(instance)!.update(value)
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
    // trigger update without changing the value
    // instance[key] = instance[key]
  }
}

const applyUpdate = () => {
  console.log('not needed anymore')
}

const applyAllUpdates = () => {
  console.log('not needed anymore')
}

const stdEquality = <T>(a: T, b: T) => a === b
const map = <From, To>(mapping: Function1<From, To>, fn: Function1<To, CleanupExec>, _: Function2<To, To, boolean> = stdEquality) => {
  return (value: From) => fn(mapping(value))
}


export default {
  update,
  listen,
  map,
  applyUpdate,
  applyAllUpdates,
}