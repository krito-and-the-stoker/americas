import type { FunctionVoid } from "util/types"
import type { Listen, CleanupExec } from "./types"
import { chain } from "./chain"
import Util from 'util/util'

interface ConnectCall {
  <V1, V2>(listen1: Listen<V2, V1>): FunctionVoid
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): FunctionVoid
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): FunctionVoid
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): FunctionVoid
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): FunctionVoid
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): FunctionVoid
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): FunctionVoid
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): FunctionVoid
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): FunctionVoid
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): FunctionVoid
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): FunctionVoid

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): FunctionVoid
}

export const connect: ConnectCall = (listen1: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): FunctionVoid => {
  const chained = chain(listen1, ...additionalListeners) as Listen<any, void>
  const unsubscribe = chained(() => {})
  return () => { Util.execute(unsubscribe, true) }
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
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): V11
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): V12

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): unknown
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
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): Promise<V11>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): Promise<V12>

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Promise<unknown>
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





