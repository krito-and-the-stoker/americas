import type { EffectFn, Listen, Function1 } from 'util/signal/types'

import { chain } from 'util/signal/chain'
import { primitive } from 'util/signal/primitive'
import { key } from 'util/signal/object'
import { log, effect } from 'util/signal/effect'
import { awaitFn } from 'util/signal/async'
import { createSolid, fromSolid } from 'util/signal/solid'
import { collect } from 'util/signal/collect'
import { each } from 'util/signal/each'
import { combine } from 'util/signal/combine'



function emit<V>(value: V) {
  return (fn: EffectFn<V>) => fn(value)
}


const gate = <V>(condition: Function1<V, boolean>): Listen<V, V> => {
  return (resolve: EffectFn<V>, value: V) => {
    if (condition(value)) {
      return resolve(value)
    }
  }
}

function select<From, To>(mapping: Function1<From, To>): Listen<To, From> {
  return (fn: EffectFn<To>, value: From) => fn(mapping(value))
}


export default {
  primitive,
  key,
  emit,
  select,
  effect,
  collect,
  log,
  await: awaitFn,
  gate,
  chain,
  createSolid,
  fromSolid,
  each,
  combine,
}


