import type { EffectFn, Listen } from 'util/signal/types'
import { chain } from './chain'

interface CollectCall {
  <V1>(): Listen<V1[], V1>
  <V1, V2>(listen1: Listen<V2, V1[]>): Listen<V2, V1>
  <V1, V2, V3>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>): Listen<V3, V1>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4, V1>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5, V1>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6, V1>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1[]>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10, V1>
  (listen1: Listen<unknown, unknown[]>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown>
}
type CollectState<V> = {
  values: V[]
}
export const collect: CollectCall = (listen1?: Listen<any, any[]>, ...additionalListeners: Listen<any, any>[]) => {
  const listen = listen1
    ? chain(listen1 as Listen<any, any>, ...additionalListeners)
    : (resolve: EffectFn<any[]>, value: any) => resolve([value])
  let state: CollectState<any> = {
    values: []
  }
  const rememberState = (lastState: CollectState<any>) => (final: boolean) => {
    if (final) {
      state = { values: [] }
    } else {
      state = lastState
    }
  }

  return (resolve: EffectFn<any>, parameter: any) => {
    state.values.push(parameter)
    const boundState = state
    const newResolve = (value: any) => {
      boundState.values = []
      return resolve(value)
    }
    return [
      listen(newResolve, state.values),
      rememberState(state)
    ]
  }
}
