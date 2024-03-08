import { FunctionVoid, Function1, Falsy } from 'util/types'

export type Executable<Func> = void | Falsy | Func | Executable<Func>[]


export type CleanupExec = Executable<Function1<boolean, void>>
export type EffectFn<V> = (value: V) => CleanupExec
export type Listen<V, P = void> = (resolve: EffectFn<V>, parameter: P) => CleanupExec
export type Update<V> = (value: V) => void
export type ListenerDescription<V> = {
  cleanup: CleanupExec,
  fn: EffectFn<V>
}

export type BasicSignal<V> = {
  listen: Listen<V>
  update: Update<V>
  value: V
  disconnect: FunctionVoid
}

export type BasicComputed<V> = {
  listen: Listen<V>
  value: V
  disconnect: FunctionVoid
}

export type AsyncStrategy = 'cancel' | 'pass' | 'queue' | 'order'
