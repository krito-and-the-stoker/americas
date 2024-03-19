import { FunctionVoid, Function1, Falsy } from 'util/types'

export type Executable<Func> = void | Falsy | Func | Executable<Func>[]


export type CleanupExec = Executable<Function1<boolean, void>>
export type Update<V> = (value: V) => void

export type ListenerDescription<V> = {
  cleanup: CleanupExec,
  fn: NextFn<V>
}


export type BasicSignal<V> = {
  listen: ConnectedChain<void, V>
  update: Update<V>
  value: V
  disconnect: FunctionVoid
}

export type BasicComputed<V> = {
  listen: ConnectedChain<void, V>
  value: V
  disconnect: FunctionVoid
}


export type NextFn<V> = (value: V) => CleanupExec
export type Context = {
  [key: string]: any
}
export type Chain<From, To = From> = (next: NextFn<To>, parameter: From, context: Context) => CleanupExec
export type ConnectedChain<From, To> = (next: NextFn<To>, parameter: From) => CleanupExec
