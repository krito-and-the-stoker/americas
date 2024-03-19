import { createSignal, onCleanup, createEffect } from 'solid-js'
import type { Accessor } from 'solid-js'

import Util from 'util/util'

import type { Chain, BasicComputed, ConnectedChain } from 'util/signal/types'
import { create } from './primitive'
import { chain } from './chain'



interface CreateCall {
  <V2>(element1: Chain<void, V2>): Accessor<V2>
  <V2, V3>(element1: Chain<void, V2>, element2: Chain<V2, V3>): Accessor<V3>
  <V2, V3, V4>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>): Accessor<V4>
  <V2, V3, V4, V5>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>): Accessor<V5>
  <V2, V3, V4, V5, V6>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>): Accessor<V6>
  <V2, V3, V4, V5, V6, V7>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>): Accessor<V7>
  <V2, V3, V4, V5, V6, V7, V8>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>): Accessor<V8>
  <V2, V3, V4, V5, V6, V7, V8, V9>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>): Accessor<V9>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>): Accessor<V10>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>): Accessor<V11>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>): Accessor<V12>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>): Accessor<V13>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>): Accessor<V14>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>, element14: Chain<V14, V15>): Accessor<V15>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>, element14: Chain<V14, V15>, element15: Chain<V15, V16>): Accessor<V16>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>, element14: Chain<V14, V15>, element15: Chain<V15, V16>, element16: Chain<V16, V17>): Accessor<V17>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>, element14: Chain<V14, V15>, element15: Chain<V15, V16>, element16: Chain<V16, V17>, element17: Chain<V17, V18>): Accessor<V18>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>, element14: Chain<V14, V15>, element15: Chain<V15, V16>, element16: Chain<V16, V17>, element17: Chain<V17, V18>, element18: Chain<V18, V19>): Accessor<V19>
  <V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19, V20>(element1: Chain<void, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>, element12: Chain<V12, V13>, element13: Chain<V13, V14>, element14: Chain<V14, V15>, element15: Chain<V15, V16>, element16: Chain<V16, V17>, element17: Chain<V17, V18>, element18: Chain<V18, V19>, element19: Chain<V19, V20>): Accessor<V20>

  (first: Chain<unknown, unknown>, ...elements: Chain<unknown, unknown>[]): Accessor<unknown>
}

export const createSolid: CreateCall = (listen1: Chain<void, any>, ...args: Chain<any, any>[]) => {
  const listener = chain(listen1 as Chain<any, any>, ...args) as Chain<void, any>
  const [solidSignal, setSolidSignal] = createSignal(undefined as any, { equals: false })

  const context = {}
  const cleanup = listener(value => {
    setSolidSignal(() => value)
  }, undefined, context)

  onCleanup(() => Util.execute(cleanup, true))

  return solidSignal
}

export const fromSolid = <V>(signal: Accessor<V>): BasicComputed<V> => {
  const base = create(signal())

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

export const listenSolid = <V>(signal: Accessor<V>): ConnectedChain<void, V> => {
  const base = create(signal())

  createEffect(() => {
    base.update(signal())
  })

  return base.listen
}

