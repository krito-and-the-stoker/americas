import { emit, select, through, gate } from 'util/signal/tools'
import { chain } from 'util/signal/chain'
import { primitive, connect } from 'util/signal/primitive'
import { key } from 'util/signal/object'
import { log, effect } from 'util/signal/effect'
import { awaitFn } from 'util/signal/async'
import { createSolid, fromSolid } from 'util/signal/solid'
import { collect } from 'util/signal/collect'
import { each } from 'util/signal/each'
import { combine } from 'util/signal/combine'
import { assert,
  assertHasValue,
  isNothing,
  isNotNothing,
  isNumber,
  isArray,
  isBoolean,
  isString,
  isFunction,
  isObject,
  isError,
  isNotNumber,
  isNotArray,
  isNotBoolean,
  isNotString,
  isNotFunction,
  isNotObject,
  isNotError,
}  from 'util/signal/assert'
import { catchFn } from 'util/signal/catch'



export default {
  primitive,
  connect,
  key,
  emit,
  select,
  effect,
  collect,
  through,
  log,
  await: awaitFn,
  gate,
  chain,
  createSolid,
  fromSolid,
  each,
  combine,
  assertHasValue,
  assert,
  catch: catchFn,
  isNothing,
  isNotNothing,
  isNumber,
  isArray,
  isBoolean,
  isString,
  isFunction,
  isObject,
  isError,
  isNotNumber,
  isNotArray,
  isNotBoolean,
  isNotString,
  isNotFunction,
  isNotObject,
  isNotError,
}

