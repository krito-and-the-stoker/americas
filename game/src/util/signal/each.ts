import type { Listen, CleanupExec, } from './types'
import { chain } from './chain'
import { through } from './tools'
import Util from 'util/util'

interface EachCall {
  <V>(): Listen<V[], V[]>
  <V1, V2>(listen1: Listen<V2, V1>): Listen<V2[], V1[]>
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>): Listen<V3[], V1[]>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4[], V1[]>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5[], V1[]>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6[], V1[]>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7[], V1[]>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8[], V1[]>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9[], V1[]>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10[], V1[]>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): Listen<V11[], V1[]>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): Listen<V12[], V1[]>

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown[], unknown[]>
}
export const each: EachCall = (listen1?: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): Listen<any, any> => {
  if (!listen1) {
    return through()
  }
  const listen = chain(listen1, ...additionalListeners)
  return (resolve, parameters) => {
    if (!parameters) {
      return resolve(parameters)
    }

    const values: any[] = []
    let updateReady = false
    let pendingCleanup: CleanupExec = null

    const cleanup = (final: boolean = false) => {
      Util.execute(pendingCleanup, final)
      pendingCleanup = null
    }

    const updateItem = (value: any, i: number) => {
      values[i] = value

      if (!updateReady) {
        return
      }

      return [
        resolve(values.filter(x => x !== undefined && x !== null)),
        cleanup,
        () => { delete values[i] }
      ]
    }

    const unsubscribe = parameters.map((item: any, i: number) => listen((value: any) => updateItem(value, i), item))
    updateReady = true
    pendingCleanup = resolve(values)

    return [unsubscribe, cleanup]
  }
}

