import type { EffectFn, Listen, AsyncStrategy, CleanupExec } from 'util/signal/types'
import type { Function0, Function1 } from 'util/types'
import { chain } from 'util/signal/chain'

import Util from 'util/util'

const createState = <T>(maker: Function0<T>) => {
    let sharedState: T | null = null

    const read = (): T => {
        if (!sharedState) {
            sharedState = maker()
        }
        return sharedState
    }

    const write = (privateState?: T) => {
        const boundState = privateState ?? read()
        sharedState = null

        // this is how the state preservation works:
        // it will bound and then the destructor, which is invoked
        // every time before the next run, will restore the state
        return (final: boolean) => {
            if (!final) {
                sharedState = boundState
            }
        }
    }

    return {
        read,
        write
    }
}


interface AwaitCall {
  <V1, V2>(listen1: Listen<Promise<V2>, V1>): Listen<V2, V1>
  <V1, V2, V3>(listen1: Listen<V2, V1>, listen2: Listen<Promise<V3>, V2>): Listen<V3, V1>
  <V1, V2, V3, V4>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<Promise<V4>, V3>): Listen<V4, V1>
  <V1, V2, V3, V4, V5>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<Promise<V5>, V4>): Listen<V5, V1>
  <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<Promise<V6>, V5>): Listen<V6, V1>
  <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<Promise<V7>, V6>): Listen<V7, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<Promise<V8>, V7>): Listen<V8, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<Promise<V9>, V8>): Listen<V9, V1>
  <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<Promise<V10>, V9>): Listen<V10, V1>

  (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown>
}



export const awaitThrough: AwaitCall = (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown> => {
    const state = createState<{ isActive: boolean }>(() => ({ isActive: true }))
    const listen = chain(listen1, ...additionalListeners)

    return (resolve, value) => {
        let cleanupInner: CleanupExec
        let cleanupResolve: CleanupExec

        const privateState = state.read()
        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                privateState.isActive = false
            }

            Util.execute(cleanupInner, final)
            Util.execute(cleanupResolve, final)
        }

        cleanupInner = listen(promise => {
            (promise as Promise<unknown>).then(value => {
                if (privateState.isActive) {
                    Util.execute(cleanupResolve)
                    cleanupResolve = resolve(value)
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

    return (resolve, value) => {
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
                    cleanupResolve = resolve(value)
                }
            })
            }, value)

        return cleanupFunction
    }
}

export const awaitOrdered: AwaitCall = (listen1: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown, unknown> => {
    const state = createState(() => ({ queue: [] as Promise<void>[], isActive: true }))
    const listen = chain(listen1, ...additionalListeners)

    return (resolve, value) => {
        let cleanupInner: CleanupExec
        let cleanupResolve: CleanupExec
        const privateState = state.read()

        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                privateState.isActive = false
            }

            Util.execute(cleanupInner, final)
            Util.execute(cleanupResolve, final)
        }

        cleanupInner = listen(promise => {
            const waitingPromise = Promise.all(privateState.queue)
                .then(() => promise)
                .then(result => {
                    if (privateState.isActive) {
                        Util.execute(cleanupResolve)
                        cleanupResolve = resolve(result)
                    }
                })
                // // .catch(resolveErrorToNextStage)
                .finally(() => {
                    privateState.queue = privateState.queue.filter(p => p !== waitingPromise)
                })
            privateState.queue.push(waitingPromise)

            // (promise as Promise<unknown>).then(value => {
            //     if (privateState.isActive) {
            //         Util.execute(cleanupResolve)
            //         cleanupResolve = resolve(value)
            //     }
            // })
            }, value)

        return [
            cleanupFunction,
            state.write(),
        ]
    }
}


export function awaitFn<From, To>(asyncFunction: Function1<From, Promise<To>>, strategy: AsyncStrategy = 'discard'): Listen<To | Error, From> {
    let state = {
        queue: [] as Promise<void>[],
    }
    const rememberState = (value: typeof state) => {
        state = {
            queue: []
        }
        return (final: boolean) => {
            if (!final) {
                state = value
            }
        }
    }

    return (resolve: EffectFn<To | Error>, parameter: From) => {
        let nextCleanup: CleanupExec = null
        let shouldResolve = true
        const cleanup = (final: boolean) => {
            Util.execute(nextCleanup, final)
            nextCleanup = null

            if (final || strategy === 'discard') {
                shouldResolve = false
                state.queue = []
            }
        }

        const resolveToNextStage = (result: To) => {
            if (shouldResolve) {
                nextCleanup = resolve(result)
            }
        }

        const resolveErrorToNextStage = (error: Error) => {
            if (shouldResolve) {
                nextCleanup = resolve(error)
            }
        }

        if (strategy === 'queue') {
            const bindState = state
            const waitingPromise = Promise.all(state.queue)
                .then(() => asyncFunction(parameter))
                .then(resolveToNextStage)
                .catch(resolveErrorToNextStage)
                .finally(() => {
                    bindState.queue = bindState.queue.filter(p => p !== waitingPromise)
                })
            state.queue.push(waitingPromise)
        }

        if (strategy === 'order') {
            const promise = asyncFunction(parameter)
            const bindState = state
            const waitingPromise = Promise.all(state.queue)
                .then(() => promise.then(resolveToNextStage))
                .catch(resolveErrorToNextStage)
                .finally(() => {
                    bindState.queue = bindState.queue.filter(p => p !== waitingPromise)
                })
            state.queue.push(waitingPromise)
        }

        if (strategy === 'pass' || strategy === 'discard') {
            const promise = asyncFunction(parameter)
            promise.then(resolveToNextStage).catch(resolveErrorToNextStage)
        }

        return [
            cleanup,
            rememberState(state),
        ]
    }
}

