import { createSignal, onCleanup, createEffect } from 'solid-js'
import type { Accessor } from 'solid-js'

import Util from 'util/util'

import type { Listen, BasicComputed } from 'util/signal/types'
import { primitive } from './primitive'
import { chain } from './chain'



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
  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Accessor<unknown>
}

export const createSolid: CreateCall = (listen1: Listen<any, void>, ...args: Listen<any, any>[]) => {
  const listener = chain(listen1 as Listen<any, any>, ...args) as Listen<any, void>
  const [solidSignal, setSolidSignal] = createSignal(undefined as any, { equals: false })
  const cleanup = listener(value => {
    setSolidSignal(() => value)
  })

  onCleanup(() => Util.execute(cleanup, true))

  return solidSignal
}

export const fromSolid = <V>(signal: Accessor<V>): BasicComputed<V> => {
  const base = primitive(signal())

  createEffect(() => {
    base.update(signal())
  })

  return {
    listen: base.listen,
    disconnect: base.disconnect,
    get value() {
      return base.value
   }
  }
}
