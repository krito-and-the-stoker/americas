import type { EffectFn, ListenerDescription, CleanupExec, BasicSignal, BasicComputed, Listen } from 'util/signal/types'
import { chain } from 'util/signal/chain'
import Util from 'util/util'

const ASYNC_UPDATES = true

interface ConnectCall {
  <V1, V2>(listen1: Listen<V2, V1>): BasicComputed<V2>
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): BasicComputed<V3>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): BasicComputed<V4>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): BasicComputed<V5>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): BasicComputed<V6>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): BasicComputed<V7>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): BasicComputed<V8>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): BasicComputed<V9>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): BasicComputed<V10>

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): BasicComputed<unknown>
}

export const connect: ConnectCall = (listen1: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): BasicComputed<any> => {
  const chained = chain(listen1, ...additionalListeners) as Listen<any, void>
  let currentValue: any
  let unsubscribe = [
    chained(value => {
      currentValue = value
    })
  ]

  const listen = (fn: EffectFn<any>): CleanupExec => {
    const remove = chained(fn)
    unsubscribe.push(remove)

    return () => {
      Util.execute(remove, true)
      unsubscribe = unsubscribe.filter(other => other !== remove)
    }
  }

  const disconnect = () => {
    currentValue = undefined as any
    Util.execute(unsubscribe, true)
  }

  return {
    listen,
    disconnect,
    get value() {
      return currentValue
    }
  }
}


export const create = <V>(initialValue: V): BasicSignal<V> => {
  let disconnected = false
  let currentValue = initialValue
  let listeners: ListenerDescription<V>[] = []

  const listen = (fn: EffectFn<V>): CleanupExec => {
    if (disconnected) {
      return
    }
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
    if (disconnected) {
      return
    }
    currentValue = newValue
    if (ASYNC_UPDATES) {
      setTimeout(() => {
        listeners.forEach(listener => {
          Util.execute(listener.cleanup)
          listener.cleanup = listener.fn(currentValue)
        })
      })
    } else {
      listeners.forEach(listener => {
        Util.execute(listener.cleanup)
        listener.cleanup = listener.fn(currentValue)
      })
    }
  }

  const disconnect = () => {
    listeners.forEach(listener => {
      Util.execute(listener.cleanup, true)
      listener.cleanup = null
    })
    listeners = []
    currentValue = undefined as V
    disconnected = true
  }

  return {
    listen,
    update,
    disconnect,
    get value() {
      return currentValue
    },
    set value(value) {
      update(value)
    }
  }
}
