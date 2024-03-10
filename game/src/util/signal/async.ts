import type { EffectFn, Listen, AsyncStrategy, CleanupExec } from 'util/signal/types'
import type { Function1 } from 'util/types'

import Util from 'util/util'

export function awaitFn<From, To>(asyncFunction: Function1<From, Promise<To>>, strategy: AsyncStrategy = 'cancel'): Listen<To | Error, From> {
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

      if (final || strategy === 'cancel') {
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

    if (strategy === 'pass' || strategy === 'cancel') {
      const promise = asyncFunction(parameter)
      promise.then(resolveToNextStage).catch(resolveErrorToNextStage)
    }

    return [
      cleanup,
      rememberState(state),
    ]
  }
}

