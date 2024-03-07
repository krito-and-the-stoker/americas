import type { EffectFn, Listen } from 'util/signal/types'


export function effect<V>(sideEffect: EffectFn<V>): Listen<V, V> {
  return (resolve: EffectFn<V>, parameter: V) => {
    return [
      sideEffect(parameter),
      resolve(parameter),
    ]
  }
}
// log the signal at any point
export const log = <V>(message?: string) => effect<V>(value => console.log(message ?? 'Signal.log:', value))
