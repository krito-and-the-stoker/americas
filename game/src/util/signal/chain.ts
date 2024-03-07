import type { EffectFn, Listen } from 'util/signal/types'

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

export const chain: ChainCall = (listen1: Listen<any, any>, listen2?: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): Listen<any, any> => {
  if (!listen2) {
    return listen1
  }
  if (additionalListeners.length > 0) {
    // @ts-ignore
    return chain(chain2(listen1, listen2), ...additionalListeners)
  }

  return chain2(listen1, listen2)
}
