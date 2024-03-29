import Goods from 'data/goods'

import Binding from 'util/binding'
import Util from 'util/util'

const update = (storage, pack) => {
  if (pack && pack.amount) {
    storage[pack.good] += pack.amount
  }
  Binding.update(storage)
}

const hasListener = Binding.hasListener

const copy = storage => {
  const result = {}
  goods(storage).forEach(pack => (result[pack.good] = pack.amount))
  productions(storage).forEach(pack => (result[pack.good] = pack.amount))

  return result
}
const equals = (some, other) =>
  some &&
  other &&
  Object.keys(some)
    .filter(key => key !== 'listeners')
    .every(key => Math.round(some[key]) === Math.round(other[key]))
const listen = (storage, fn) => Binding.listen(storage, null, fn)
const create = () => Goods.types.reduce((obj, name) => ({ ...obj, [name]: 0 }), {})
const createWithProduction = () =>
  Goods.types.concat(Goods.productions).reduce((obj, name) => ({ ...obj, [name]: 0 }), {})

const split = storage =>
  goods(storage)
    .filter(({ amount }) => amount > 0)
    .map(({ good, amount }) =>
      Util.range(Math.ceil(amount / 100))
        .map(i => Math.min(100 * (i + 1), amount - 100 * i))
        .map(amount => ({ good, amount }))
    )
    .flat()

const transfer = (src, dest, pack = {}) => {
  const move = ({ good, amount }) => {
    if (amount) {
      dest[good] += amount
      src[good] -= amount
    } else {
      dest[good] += src[good]
      src[good] = 0
    }
  }

  if (pack.good) {
    move(pack)
  } else {
    goods(src).forEach(move)
  }

  update(src)
  update(dest)
}

const total = storage => Util.sum(goods(storage).map(pack => pack.amount))
const maximum = storage => Util.max(goods(storage).map(pack => pack.amount))

const transferWithProduction = (src, dest) => {
  const move = pack => {
    dest[pack.good] += pack.amount
    src[pack.good] = 0
  }
  goods(src).forEach(move)
  productions(src).forEach(move)

  update(src)
  update(dest)
}

const clearWithProduction = storage => {
  goods(storage).forEach(({ good }) => {
    storage[good] = 0
  })
  productions(storage).forEach(({ good }) => {
    storage[good] = 0
  })
}

const goods = storage =>
  Object.values(Goods.types).map(good => ({
    good,
    amount: storage[good] || 0,
  }))
const productions = storage =>
  Object.values(Goods.productions).map(good => ({
    good,
    amount: storage[good] || 0,
  }))

const save = storage => Object.values(Goods.types).map(good => [good, storage[good]])
const load = data => Util.makeObject(data)

export default {
  create,
  createWithProduction,
  listen,
  update,
  hasListener,
  split,
  transfer,
  transferWithProduction,
  load,
  save,
  total,
  maximum,
  goods,
  clearWithProduction,
  productions,
  equals,
  copy,
}
