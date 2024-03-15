import { emit, select, stopIf, stop, passIf, count } from 'util/signal/tools'
import { chain, sideChain } from 'util/signal/chain'
import * as primitive from 'util/signal/primitive'
import { key } from 'util/signal/object'
import { log, effect } from 'util/signal/effect'
import { awaitParallel, awaitLatest, awaitOrder, awaitQueue, awaitBlock } from 'util/signal/async'
import { createSolid, fromSolid } from 'util/signal/solid'
import { collect, buffer, window } from 'util/signal/collect'
import { each } from 'util/signal/each'
import { combine } from 'util/signal/combine'
import { maybeKey, maybeSelect } from 'util/signal/maybe'
import { connect, evaluate, firstValue } from 'util/signal/connect'
import { listenToEvent } from 'util/signal/event'
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

const maybe = {
  select: maybeSelect,
  listen: {
    key: maybeKey
  }
}

const awaitFns = {
  parallel: awaitParallel,
  latest: awaitLatest,
  order: awaitOrder,
  queue: awaitQueue,
  block: awaitBlock,
}

const listen = {
  key,
  event: listenToEvent,
  // maybe: {
  //   key: maybeKey,
  // }
}

export default {
  primitive,
  listen,
  connect,
  evaluate,
  firstValue,
  emit,
  select,
  effect,
  collect,
  buffer,
  window,
  log,
  count,
  stop,
  await: awaitFns,
  stopIf,
  passIf,
  chain,
  sideChain,
  createSolid,
  fromSolid,
  each,
  combine,
  assert,
  maybe,
  catch: catchFn,
}

