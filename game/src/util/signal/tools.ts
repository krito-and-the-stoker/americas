import type { NextFn, Chain } from 'util/signal/types'
import type { Function0, Function1 } from 'util/types'

export const createState = <T>(maker: Function0<T>) => {
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

export function count<V>(): Chain<V, number> {
  return (next, _, context) => {
    context.count = (context.count ?? 0) + 1

    return next(context.count)
  }
}

export function emit<V>(parameter: V): Chain<void, V> {
  return (next: NextFn<V>) => next(parameter)
}


export function passIf<V>(condition: Function1<V, boolean>): Chain<V> {
  return (next: NextFn<V>, parameter: V) => {
    if (condition(parameter)) {
      return next(parameter)
    }
  }
}
export function stopIf<V>(condition: Function1<V, boolean>): Chain<V> {
  return (next: NextFn<V>, parameter: V) => {
    if (!condition(parameter)) {
      return next(parameter)
    }
  }
}

export function stop<V>(): Chain<V, never> {
  return () => {}
}


export function through<V>(): Chain<V> {
  return (fn: NextFn<V>, parameter: V) => fn(parameter)
}

export function select<V>(): Chain<V>
export function select<From, To>(mapping: Function1<From, To>): Chain<From, To>
export function select<From, To>(mapping?: Function1<From, To>): Chain<From, To> {
  if (mapping) {
    return (fn: NextFn<To>, parameter: From) => fn(mapping(parameter))
  }

  return through() as any
}
