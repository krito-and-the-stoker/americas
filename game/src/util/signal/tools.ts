import type { EffectFn, Listen } from 'util/signal/types'
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

export function count<V>(): Listen<number, V> {
  let state = createState(() => ({ counter: -1 }))

  return (next) => {
    const privateState = state.read()
    privateState.counter++

    return [
      state.write(),
      next(privateState.counter),
    ]
  }
}

export function emit<V>(value: V): Listen<V, void> {
  return (fn: EffectFn<V>) => fn(value)
}


export function gate<V>(condition: Function1<V, boolean>): Listen<V, V> {
  return (resolve: EffectFn<V>, value: V) => {
    if (condition(value)) {
      return resolve(value)
    }
  }
}

export function stop<V>(): Listen<never, V> {
  return () => {}
}


export function through<V>(): Listen<V, V> {
  return (fn: EffectFn<V>, parameter: V) => fn(parameter)
}

export function select<V>(): Listen<V, V>
export function select<From, To>(mapping: Function1<From, To>): Listen<To, From>
export function select<From, To>(mapping?: Function1<From, To>): Listen<To, From> {
  if (mapping) {
    return (fn: EffectFn<To>, value: From) => fn(mapping(value))
  }

  return through() as any
}