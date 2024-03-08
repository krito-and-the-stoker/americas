export type FunctionVoid = () => void
export type Function0<R> = () => R
export type Function1<A, R> = (value: A) => R
export type Function2<A, B, R> = (first: A, second: B) => R
export type FunctionAny<R> = (...args: unknown[]) => R

export type Falsy = false | 0 | '' | null | undefined
export type Maybe<T> = T | null | undefined

export type Coordinates = {
  x: number
  y: number
}

export interface HasCoordinates {
  mapCoordinates: Coordinates
}
