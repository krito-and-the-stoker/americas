import type { EffectFn, Listen, Function1 } from 'util/signal/types'

import { chain } from 'util/signal/chain'
import { primitive } from './signal/primitive'
import { key, objectListener } from './signal/object'
import { effect } from 'solid-js/web'
import { log } from './signal/effect'
import { awaitFn } from './signal/async'
import { createSolid, fromSolid } from './signal/solid'
import { collect } from './signal/collect'



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
  objectListener,
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
}


