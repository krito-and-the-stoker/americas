import type { EffectFn, ListenerDescription, CleanupExec, BasicSignal } from 'util/signal/types'
import Util from 'util/util'


export const primitive = <V>(initialValue: V): BasicSignal<V> => {
  let currentValue = initialValue
  let listeners: ListenerDescription<V>[] = []

  const listen = (fn: EffectFn<V>): CleanupExec => {
    const listener = {
      cleanup: fn(currentValue),
      fn
    }

    listeners.push(listener)

    return () => {
      Util.execute(listener.cleanup)
      listener.cleanup = null
      listeners = listeners.filter(other => other !== listener)
    }
  }

  const update = (newValue: V) => {
    currentValue = newValue
    listeners.forEach(listener => {
      Util.execute(listener.cleanup)
      listener.cleanup = listener.fn(currentValue)
    })
  }

  return {
    listen,
    update,
    get value() {
      return currentValue
    }
  }
}
