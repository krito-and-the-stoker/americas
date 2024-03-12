import { Maybe, Function1 } from 'util/types'
import { Listen, EffectFn } from './types'

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

const maybeSelect = <V1, Filter extends V1 & (null | undefined), From extends Exclude<V1, Filter>, To>(mapping: Function1<From, To>): Listen<To | Filter, From | V1> => {
  return (resolve: EffectFn<Filter | To>, value: V1 | From) => {
    if (value !== undefined && value !== null) {
      return resolve(mapping(value as any))
    }

    return resolve(value as Filter)
  }
}


export const maybe = {
  key: maybeKey,
  select: maybeSelect,
  // chain: isNotNothing,
  // effect,
  // await: awaitFn,
  // each,
  // combine,
  // catch: catchFn,
}
