import { CleanupExec } from "./signal/types"
import { objectListener } from "./signal/object"
import type { Function1, Function2 } from 'util/types'

const listen = <O extends Object, Key extends keyof O>(instance: O, key: Key, fn: Function1<O[Key], CleanupExec>) => {
  return objectListener(instance, key)(fn)
}

const update = <O extends Object, Key extends keyof O>(instance: O, key: Key, value: O[Key]) => {
  if (value !== undefined) {
    if (instance[key] === value) {
      return
    }
    instance[key] = value
  } else {
    // trigger update without changing the value
    instance[key] = instance[key]
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