import type { Chain, CleanupExec } from 'util/signal/types'
import { chain } from 'util/signal/chain'

import Util from 'util/util'


interface AwaitCall {
    <V1, V2>(listen1: Chain<V1, Promise<V2>>): Chain<V1, V2 | Error>
    <V1, V2, V3>(listen1: Chain<V1, V2>, listen2: Chain<V2, Promise<V3>>): Chain<V1, V3 | Error>
    <V1, V2, V3, V4>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, Promise<V4>>): Chain<V1, V4 | Error>
    <V1, V2, V3, V4, V5>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, Promise<V5>>): Chain<V1, V5 | Error>
    <V1, V2, V3, V4, V5, V6>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, Promise<V6>>): Chain<V1, V6 | Error>
    <V1, V2, V3, V4, V5, V6, V7>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, Promise<V7>>): Chain<V1, V7 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, Promise<V8>>): Chain<V1, V8 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, Promise<V9>>): Chain<V1, V9 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, Promise<V10>>): Chain<V1, V10 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, Promise<V11>>): Chain<V1, V11 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, Promise<V12>>): Chain<V1, V12 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, Promise<V13>>): Chain<V1, V13 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, Promise<V14>>): Chain<V1, V14 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, Promise<V15>>): Chain<V1, V15 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, Promise<V16>>): Chain<V1, V16 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, Promise<V17>>): Chain<V1, V17 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>, listen17: Chain<V17, Promise<V18>>): Chain<V1, V18 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>, listen17: Chain<V17, V18>, listen18: Chain<V18, Promise<V19>>): Chain<V1, V19 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19, V20>(listen1: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>, listen17: Chain<V17, V18>, listen18: Chain<V18, V19>, listen19: Chain<V19, Promise<V20>>): Chain<V1, V20 | Error>


    (first: Chain<unknown, unknown>, ...elements: Chain<unknown, unknown>[]): Chain<unknown | Error, unknown>
}


export const awaitParallel: AwaitCall = (listen1: Chain<unknown, unknown>, ...additionalListeners: Chain<unknown, unknown>[]): Chain<unknown, unknown | Error> => {
    const listen = chain(listen1, ...additionalListeners)

    return (next, value, context) => {
        let cleanupInner: CleanupExec

        if (!context.isInitialized) {
            context.isActive = true
            context.cleanupNext = null
            context.inner = {}
            context.isInitialized = true
        }
        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                context.isActive = false
            }

            Util.execute(cleanupInner, final)
            Util.execute(context.cleanupNext, final)
        }

        cleanupInner = listen(promise => {
            (promise as Promise<unknown>).then(value => {
                if (context.isActive) {
                    Util.execute(context.cleanupNext)
                    context.cleanupNext = next(value)
                }
            }).catch(error => {
                if (context.isActive) {
                    Util.execute(context.cleanupNext)
                    context.cleanupNext = next(error)
                }
            })
            }, value, context.inner)

        return cleanupFunction
    }
}

export const awaitLatest: AwaitCall = (listen1: Chain<unknown, unknown>, ...additionalListeners: Chain<unknown, unknown>[]): Chain<unknown, unknown> => {
    const listen = chain(listen1, ...additionalListeners)

    return (next, parameter, context) => {
        let cleanupInner: CleanupExec
        let cleanupNext: CleanupExec
        let isActive = true

        const cleanupFunction = (final: boolean = false) => {
            isActive = false
            Util.execute(cleanupInner, final)
            Util.execute(cleanupNext, final)
        }

        cleanupInner = listen(promise => {
            (promise as Promise<unknown>).then(value => {
                if (isActive) {
                    Util.execute(cleanupNext)
                    cleanupNext = next(value)
                }
            }).catch(error => {
                if (isActive) {
                    Util.execute(cleanupNext)
                    cleanupNext = next(error)
                }
            })
            }, parameter, context)

        return cleanupFunction
    }
}

export const awaitOrder: AwaitCall = (listen1: Chain<unknown, unknown>, ...additionalListeners: Chain<unknown, unknown>[]): Chain<unknown, unknown> => {
    const listen = chain(listen1, ...additionalListeners)

    return (next, value, context) => {
        let cleanupInner: CleanupExec
        if (!context.isInitialized) {
            context.queue = []
            context.isActive = true
            context.cleanupNext = null
            context.inner = {}
            context.isInitialized = true
        }

        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                context.isActive = false
                Util.execute(context.cleanupNext, final)
            }

            Util.execute(cleanupInner, final)
        }

        cleanupInner = listen(promise => {
            const waitingPromise = Promise.all(context.queue)
                .then(() => promise)
                .then(result => {
                    if (context.isActive) {
                        Util.execute(context.cleanupNext)
                        context.cleanupNext = next(result)
                    }
                })
                .catch(error => {
                    if (context.isActive) {
                        Util.execute(context.cleanupNext)
                        context.cleanupNext = next(error)
                    }
                })
                // // .catch(resolveErrorToNextStage)
                .finally(() => {
                    context.queue = context.queue.filter((p: Promise<unknown>) => p !== waitingPromise)
                })
            context.queue.push(waitingPromise)
            }, value, context.inner)

        return cleanupFunction
    }
}

export const awaitQueue: AwaitCall = (listen1: Chain<unknown, unknown>, ...additionalListeners: Chain<unknown, unknown>[]): Chain<unknown, unknown> => {
    const listen = chain(listen1, ...additionalListeners)

    return (next, parameter, context) => {
        let cleanupInner: CleanupExec
        if (!context.isInitialized) {
            context.queue = []
            context.isActive = true
            context.cleanupNext = null
            context.inner = {}
            context.isInitialized = true
        }

        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                context.isActive = false
                Util.execute(cleanupInner, final)
            }

            Util.execute(context.cleanupNext, final)
        }

        const waitingPromise = Promise.all(context.queue)
            .then(() => new Promise(resolve => {
                Util.execute(cleanupInner, false)
                cleanupInner = listen(promise => resolve(promise), parameter, context.inner)
            }))
            .then(promise => promise).then(value => {
                if (context.isActive) {
                    Util.execute(context.cleanupNext, false)
                    context.cleanupNext = next(value)
                }
            })
            .catch(error => {
                if (context.isActive) {
                    Util.execute(context.cleanupNext, false)
                    context.cleanupNext = next(error)
                }
            })
            .finally(() => {
                context.queue = context.queue.filter((p: Promise<unknown>) => p !== waitingPromise)
            })
        context.queue.push(waitingPromise)

        return cleanupFunction
    }
}

export const awaitBlock: AwaitCall = (listen1: Chain<unknown, unknown>, ...additionalListeners: Chain<unknown, unknown>[]): Chain<unknown, unknown> => {
    const listen = chain(listen1, ...additionalListeners) as Chain<unknown, Promise<unknown>>

    return (next, parameter, context) => {
        if (!context.isInitialized) {
            context.isBlocking = false
            context.cleanupNext = null
            context.inner = {}
            context.isInitialized = true
        }

        if (context.isBlocking) {
            return
        }

        let isActive = true
        let cleanupInner: CleanupExec

        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                isActive = false
                context.isBlocking = false
                console.log('final cleanupNext', final)
                Util.execute(context.cleanupNext, final)
            }

            Util.execute(cleanupInner, final)
        }

        cleanupInner = listen((promise: Promise<unknown>) => {
            context.isBlocking = true
            promise.then(value => {
                if (isActive) {
                    Util.execute(context.cleanupNext)
                    context.cleanupNext = next(value)
                }
            }).catch(error => {
                if (isActive) {
                    Util.execute(context.cleanupNext)
                    context.cleanupNext = next(error)
                }
            }).finally(() => {
                context.isBlocking = false
            })
            }, parameter, context.inner)

        return cleanupFunction
    }
}


