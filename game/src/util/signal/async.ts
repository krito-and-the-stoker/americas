import type { EffectFn, Listen, AsyncStrategy, CleanupExec } from 'util/signal/types'
import type { Function0, Function1 } from 'util/types'

import Util from 'util/util'

const createState = <T>(maker: Function0<T>) => {
    let sharedState: T | null = null

    const get = (): T => {
        if (!sharedState) {
            sharedState = maker()
        }
        return sharedState
    }

    const write = (privateState?: T) => {
        console.log('write state', privateState, get())
        const boundState = privateState ?? get()
        sharedState = null

        return (final: boolean) => {
            if (!final) {
                sharedState = boundState
            }
        }
    }

    return {
        get,
        write
    }
}


export function awaitPass<From, To>(listen1: Listen<Promise<To>, From>): Listen<To, From> {
    const state = createState<{ isActive: boolean }>(() => ({ isActive: true }))

    return (resolve, value) => {
        let cleanup1: CleanupExec
        let cleanup: CleanupExec

        const privateState = state.get()
        const cleanupFunction = (final: boolean = false) => {
            if (final) {
                privateState.isActive = false
            }

            Util.execute(cleanup1)
            Util.execute(cleanup)
        }

        cleanup1 = listen1(promise => {
            promise.then(value => {
                if (privateState.isActive) {
                    Util.execute(cleanup)
                    cleanup = resolve(value)
                }
            })
            }, value)

        return [
            cleanupFunction,
            state.write()
        ]
    }
}

export function awaitLast<From, To>(listen1: Listen<Promise<To>, From>): Listen<To, From> {
    return (resolve, value) => {
        let cleanup1: CleanupExec
        let cleanup: CleanupExec
        let isActive = true

        const cleanupFunction = () => {
            isActive = false
            Util.execute(cleanup1)
            Util.execute(cleanup)
        }

        cleanup1 = listen1(promise => {
            promise.then(value => {
                if (isActive) {
                    Util.execute(cleanup)
                    cleanup = resolve(value)
                }
            })
            }, value)

        return cleanupFunction
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

