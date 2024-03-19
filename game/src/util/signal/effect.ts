import type { NextFn, Chain } from 'util/signal/types'


export function effect<V>(sideEffect: NextFn<V>): Chain<V> {
  return (resolve: NextFn<V>, parameter: V) => {
    return [
      sideEffect(parameter),
      resolve(parameter),
    ]
  }
}
// log the signal at any point
export const log = <V>(message?: string) => effect<V>(value => console.log(message ?? 'Signal.log:', value))
