import { createSignal, onCleanup } from 'solid-js'
import type { Accessor } from 'solid-js'

import Util from 'util/util'

type Function1<A, R = void> = (arg: A) => R
type FunctionVoid = () => void


type Executable<Func> = void | null | undefined | Func | Executable<Func>[]


type CleanupExec = Executable<Function1<boolean, void>>
type EffectFn<V> = (value: V) => CleanupExec
type Listen<V, P = void> = (resolve: EffectFn<V>, parameter: P) => CleanupExec
type Update<V> = (value: V) => void
type ListenerDescription<V> = {
  cleanup: CleanupExec,
  fn: EffectFn<V>
}

type BasicSignal<V> = {
  listen: Listen<V>
  update: Update<V>
  value: V
}


const primitive = <V>(initialValue: V): BasicSignal<V> => {
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

function key<O extends object, Key extends keyof O>(key: Key): Listen<O[Key], O> {
  return (fn: EffectFn<O[Key]>, obj: O) => {
    return objectListener(obj, key)(fn)
  }
}


function objectListener<O extends object, Key extends keyof O>(obj: O, key: Key): Listen<O[Key]> {
    // Check if the signal storage exists; if not, create it
    if (!obj.hasOwnProperty('__signals__')) {
        Object.defineProperty(obj, '__signals__', {
            value: {},
            enumerable: false, // Hide it from object iteration
            configurable: false, // Prevent deletion
            writable: false, // Prevent modification
        });
    }

    // Use an existing signal if available, or create a new one
    const signals: Record<string, BasicSignal<O[Key]>> = (obj as any).__signals__;
    if (!signals[key as string]) {
        signals[key as string] = primitive(obj[key])

        Object.defineProperty(obj, key, {
            get() {
                return signals[key as string].value
            },
            set(value: O[Key]) {
                signals[key as string].update(value)
            },
            enumerable: true,
            configurable: true,
        });
    }

    // Add the listener and return the cleanup function
    return signals[key as string].listen
}

function emit<V>(value: V) {
  return (fn: EffectFn<V>) => fn(value)
}

function effect<V>(sideEffect: EffectFn<V>): Listen<V, V> {
  return (resolve: EffectFn<V>, parameter: V) => {
    return [
      sideEffect(parameter),
      resolve(parameter),
    ]
  }
}
// log the signal at any point
const log = <V>(message?: string) => effect<V>(value => console.log(message ?? 'Signal.log:', value))

function awaitFn<From, To>(asyncFunction: Function1<From, Promise<To>>): Listen<To, From> {
  return (resolve: EffectFn<To>, parameter: From) => {
    let nextCleanup: CleanupExec = null
    let shouldResolve = true
    const cleanup = (final: boolean) => {
      Util.execute(nextCleanup, final)
      nextCleanup = null
      shouldResolve = false
    }

    asyncFunction(parameter).then(result => {
      if (shouldResolve) {
        nextCleanup = resolve(result)
      }
    })

    return cleanup
  }
}

function select<From, To>(mapping: Function1<From, To>): Listen<To, From> {
  return (fn: EffectFn<To>, value: From) => fn(mapping(value))
}

function chain2<From, To, Intermediate>(listen1: Listen<Intermediate, From>, listen2: Listen<To, Intermediate>): Listen<To, From> {
  return (fn: EffectFn<To>, value: From) => listen1(intermediate => listen2(fn, intermediate), value)
}

interface ChainCall {
  <V1, V2>(listen1: Listen<V2, V1>): Listen<V2, V1>
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): Listen<V3, V1>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4, V1>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5, V1>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6, V1>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10, V1>
  (listen1: Listen<any, any>, listen2?: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): Listen<any, any>
}

const chain: ChainCall = (listen1: Listen<any, any>, listen2?: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): Listen<any, any> => {
  if (!listen2) {
    return listen1
  }
  if (additionalListeners.length > 0) {
    // @ts-ignore
    return chain(chain2(listen1, listen2), ...additionalListeners)
  }

  return chain2(listen1, listen2)
}

interface CreateCall {
  <V2>(listen1: Listen<V2, void>): Accessor<V2>
  <V2, V3>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>): Accessor<V3>
  <V2, V3, V4>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Accessor<V4>
  <V2, V3, V4, V5>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Accessor<V5>
  <V2, V3, V4, V5, V6>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Accessor<V6>
  <V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Accessor<V7>
  <V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Accessor<V8>
  <V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Accessor<V9>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, void>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Accessor<V10>
  (listen1: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): Accessor<any>
}

const createSolid: CreateCall = (listen1: Listen<any, void>, ...args: Listen<any, any>[]) => {
  const listener = chain(listen1, ...args) as Listen<any, void>
  const [solidSignal, setSolidSignal] = createSignal(undefined as any, { equals: false })
  const cleanup = listener(value => {
    setSolidSignal(() => value)
  })

  onCleanup(() => Util.execute(cleanup, true))

  return solidSignal
}


export default {
  primitive,
  objectListener,
  key,
  emit,
  select,
  effect,
  log,
  await: awaitFn,
  chain,
  createSolid,
}


