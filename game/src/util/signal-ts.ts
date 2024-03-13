import { emit, select, gate, stop } from 'util/signal/tools'
import { chain } from 'util/signal/chain'
import * as primitive from 'util/signal/primitive'
import { key } from 'util/signal/object'
import { log, effect } from 'util/signal/effect'
import { awaitFn } from 'util/signal/async'
import { createSolid, fromSolid } from 'util/signal/solid'
import { collect } from 'util/signal/collect'
import { each } from 'util/signal/each'
import { combine } from 'util/signal/combine'
import { maybe } from 'util/signal/maybe'
import { connect, evaluate, firstValue } from 'util/signal/connect'
import { assert as createAssert,
  assertNot as createAssertNot,
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

const assert = {
  isNothing,
  isNumber,
  isArray,
  isBoolean,
  isString,
  isFunction,
  isObject,
  isError,
  create: createAssert,
  not: {
    isNothing: isNotNothing,
    isNumber: isNotNumber,
    isArray: isNotArray,
    isBoolean: isNotBoolean,
    isString: isNotString,
    isFunction: isNotFunction,
    isObject: isNotObject,
    isError: isNotError,
    create: createAssertNot,
  }
}

export default {
  primitive,
  key,
  connect,
  evaluate,
  firstValue,
  emit,
  select,
  effect,
  collect,
  log,
  stop,
  await: awaitFn,
  gate,
  chain,
  createSolid,
  fromSolid,
  each,
  combine,
  assert,
  maybe,
  catch: catchFn,
}

