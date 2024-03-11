import { Maybe } from 'util/types'
import { Listen } from './types'

import { isNotNothing } from './assert'
import { key } from './object'

interface MaybeKeyCall {
  <O extends Object, Key extends keyof O>(keyOf: Key): Listen<undefined, undefined>
  <O extends Object, Key extends keyof O>(keyOf: Key): Listen<null, null>
  <O extends Object, Key extends keyof O>(keyOf: Key): Listen<O[Key] | undefined, O | undefined>
  <O extends Object, Key extends keyof O>(keyOf: Key): Listen<O[Key] | null, O | null>
  <O extends Object, Key extends keyof O>(keyOf: Key): Listen<Maybe<O[Key]>, Maybe<O>>
  <O extends Object, Key extends keyof O>(keyOf: Key): Listen<O[Key], O>
}

const maybeKey: MaybeKeyCall = <O extends Object, Key extends keyof O>(keyOf: Key) => isNotNothing(key(keyOf)) as Listen<Maybe<O[Key]>, Maybe<O>>

export const maybe = {
  key: maybeKey,
  // key: <O extends Object, Key extends keyof O>(keyOf: Key) => isNotNothing(key(keyOf)) as Listen<Maybe<O[Key]>, Maybe<O>>
  // select,
  // effect,
  // await: awaitFn,
  // each,
  // combine,
  // catch: catchFn,
}
