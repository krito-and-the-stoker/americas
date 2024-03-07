export type Function1<A, R = void> = (arg: A) => R


export type Executable<Func> = void | null | undefined | Func | Executable<Func>[]


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
}

export type BasicComputed<V> = {
  listen: Listen<V>
  value: V
}

export type AsyncStrategy = 'cancel' | 'pass' | 'queue' | 'order'
