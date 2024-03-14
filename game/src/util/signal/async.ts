import type { Listen, CleanupExec } from 'util/signal/types'
import { chain } from 'util/signal/chain'
import { createState } from 'util/signal/tools'

import Util from 'util/util'


interface AwaitCall {
  <V1, V2>(listen1: Listen<Promise<V2>, V1>): Listen<V2 | Error, V1>
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<Promise<V3>, V2>): Listen<V3 | Error, V1>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<Promise<V4>, V3>): Listen<V4 | Error, V1>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<Promise<V5>, V4>): Listen<V5 | Error, V1>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<Promise<V6>, V5>): Listen<V6 | Error, V1>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<Promise<V7>, V6>): Listen<V7 | Error, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<Promise<V8>, V7>): Listen<V8 | Error, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<Promise<V9>, V8>): Listen<V9 | Error, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<Promise<V10>, V9>): Listen<V10 | Error, V1>

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Error, unknown>
}


export const awaitThrough: AwaitCall = (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Error, unknown> => {
    const state = createState(() => ({ isActive: true, cleanupNext: null as CleanupExec }))
    const listen = chain(listen1, ...additionalListeners)

    return (next, value) => {
        let cleanupInner: CleanupExec

        const privateState = state.read()
        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                privateState.isActive = false
            }

            Util.execute(cleanupInner, final)
            Util.execute(privateState.cleanupNext, final)
        }

        cleanupInner = listen(promise => {
            (promise as Promise<unknown>).then(value => {
                if (privateState.isActive) {
                    Util.execute(privateState.cleanupNext)
                    privateState.cleanupNext = next(value)
                }
            }).catch(error => {
                if (privateState.isActive) {
                    Util.execute(privateState.cleanupNext)
                    privateState.cleanupNext = next(error)
                }
            })
            }, value)

        return [
            cleanupFunction,
            state.write()
        ]
    }
}

export const awaitLatest: AwaitCall = (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown> => {
    const listen = chain(listen1, ...additionalListeners)

    return (next, parameter) => {
        let cleanupInner: CleanupExec
        let cleanupResolve: CleanupExec
        let isActive = true

        const cleanupFunction = (final: boolean = false) => {
            isActive = false
            Util.execute(cleanupInner, final)
            Util.execute(cleanupResolve, final)
        }

        cleanupInner = listen(promise => {
            (promise as Promise<unknown>).then(value => {
                if (isActive) {
                    Util.execute(cleanupResolve)
                    cleanupResolve = next(value)
                }
            }).catch(error => {
                if (isActive) {
                    Util.execute(cleanupResolve)
                    cleanupResolve = next(error)
                }
            })
            }, parameter)

        return cleanupFunction
    }
}

export const awaitOrder: AwaitCall = (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown> => {
    const state = createState(() => ({ queue: [] as Promise<void>[], isActive: true, cleanupNext: null as CleanupExec }))
    const listen = chain(listen1, ...additionalListeners)

    return (next, value) => {
        let cleanupInner: CleanupExec
        const privateState = state.read()

        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                privateState.isActive = false
                Util.execute(privateState.cleanupNext, final)
            }

            Util.execute(cleanupInner, final)
        }

        cleanupInner = listen(promise => {
            const waitingPromise = Promise.all(privateState.queue)
                .then(() => promise)
                .then(result => {
                    if (privateState.isActive) {
                        Util.execute(privateState.cleanupNext)
                        privateState.cleanupNext = next(result)
                    }
                })
                .catch(error => {
                    if (privateState.isActive) {
                        Util.execute(privateState.cleanupNext)
                        privateState.cleanupNext = next(error)
                    }
                })
                // // .catch(resolveErrorToNextStage)
                .finally(() => {
                    privateState.queue = privateState.queue.filter(p => p !== waitingPromise)
                })
            privateState.queue.push(waitingPromise)
            }, value)

        return [
            cleanupFunction,
            state.write(),
        ]
    }
}

export const awaitQueue: AwaitCall = (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown> => {
    const state = createState(() => ({ queue: [] as Promise<void>[], isActive: true, cleanupNext: null as CleanupExec }))
    const listen = chain(listen1, ...additionalListeners)

    return (next, parameter) => {
        let cleanupInner: CleanupExec
        const privateState = state.read()

        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                privateState.isActive = false
                Util.execute(cleanupInner, final)
            }

            Util.execute(privateState.cleanupNext, final)
        }

        const waitingPromise = Promise.all(privateState.queue)
            .then(() => new Promise(resolve => {
                Util.execute(cleanupInner, false)
                cleanupInner = listen(promise => resolve(promise), parameter)
            }))
            .then(promise => promise).then(value => {
                if (privateState.isActive) {
                    Util.execute(privateState.cleanupNext, false)
                    privateState.cleanupNext = next(value)
                }
            })
            .catch(error => {
                if (privateState.isActive) {
                    Util.execute(privateState.cleanupNext, false)
                    privateState.cleanupNext = next(error)
                }
            })
            .finally(() => {
                privateState.queue = privateState.queue.filter(p => p !== waitingPromise)
            })
        privateState.queue.push(waitingPromise)

        return [
            cleanupFunction,
            state.write(),
        ]
    }
}


