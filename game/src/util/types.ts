export type { CleanupExec } from 'signal-chain'

export type FunctionVoid = () => void
export type Function0<R = void> = () => R
export type Function1<A, R = void> = (value: A) => R
export type Function2<A, B, R = void> = (first: A, second: B) => R
export type FunctionAny<R = void> = (...args: unknown[]) => R

export type Falsy = false | 0 | '' | null | undefined
export type Maybe<T> = T | null | undefined
