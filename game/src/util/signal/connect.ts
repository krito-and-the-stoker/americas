import type { Listen, CleanupExec } from "./types"
import { chain } from "./chain"
import Util from 'util/util'

interface ConnectCall {
  <V1, V2>(listen1: Listen<V2, V1>): CleanupExec
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): CleanupExec
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): CleanupExec
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): CleanupExec
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): CleanupExec
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): CleanupExec
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): CleanupExec
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): CleanupExec
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): CleanupExec

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): CleanupExec
}

export const connect: ConnectCall = (listen1: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): CleanupExec => {
  const chained = chain(listen1, ...additionalListeners) as Listen<any, void>
  return chained(() => {})
}

interface EvaluateCall {
  <V1, V2>(listen1: Listen<V2, V1>): V2
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): V3
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): V4
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): V5
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): V6
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): V7
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): V8
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): V9
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): V10

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): CleanupExec
}

export const evaluate: EvaluateCall = (listen1: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): any => {
  const chained = chain(listen1, ...additionalListeners) as Listen<any, void>
  let currentValue = undefined
  const unsubscribe = chained(value => {
    currentValue = value
  })

  Util.execute(unsubscribe)

  return currentValue
}

interface FirstValueCall {
  <V1, V2>(listen1: Listen<V2, V1>): Promise<V2>
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): Promise<V3>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Promise<V4>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Promise<V5>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Promise<V6>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Promise<V7>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Promise<V8>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Promise<V9>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Promise<V10>

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): CleanupExec
}

export const firstValue: FirstValueCall = (listen1: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): any => {
  const chained = chain(listen1, ...additionalListeners) as Listen<any, void>
  let unsubscribe: CleanupExec
  const value = new Promise(resolve => {
    unsubscribe = chained(value => {
      resolve(value)

    })
  })

  value.then(() => {
    Util.execute(unsubscribe)
  })

  return value
}





