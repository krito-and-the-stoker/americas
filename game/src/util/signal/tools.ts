import type { EffectFn, Listen } from 'util/signal/types'
import type { Function1 } from 'util/types'

export function emit<V>(value: V) {
  return (fn: EffectFn<V>) => fn(value)
}


export function gate <V>(condition: Function1<V, boolean>): Listen<V, V> {
  return (resolve: EffectFn<V>, value: V) => {
    if (condition(value)) {
      return resolve(value)
    }
  }
}

export function select<From, To>(mapping: Function1<From, To>): Listen<To, From> {
  return (fn: EffectFn<To>, value: From) => fn(mapping(value))
}

export function through<V>(): Listen<V, V> {
  return (fn: EffectFn<V>, parameter: V) => fn(parameter)
}
