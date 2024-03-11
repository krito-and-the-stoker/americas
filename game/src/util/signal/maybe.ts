import { Maybe } from 'util/types'
import { Listen } from './types'

import { isNotNothing } from './assert'
import { key } from './object'

export const maybe = {
  key: <O extends Object, Key extends keyof O>(keyOf: Key): Listen<Maybe<O[Key]>, Maybe<O>> => isNotNothing(key(keyOf)),
  // select,
  // effect,
  // await: awaitFn,
  // each,
  // combine,
  // catch: catchFn,
}
