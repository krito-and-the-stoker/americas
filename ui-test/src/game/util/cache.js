import Util from 'util/util'

const create = ({ initFn, keyFn, shouldCache, valueFn }) => {
  let cache = {}

  const wipeCache = keepKey => {
    const newCache = {}
    if (keepKey) {
      Object.keys(cache)
        .filter(key => keepKey(key))
        .forEach(key => {
          newCache[key] = cache[key]
        })
    }
    cache = newCache
  }

  let initialized = false

  return (...args) => {
    if (!initialized) {
      initialized = true
      Util.execute(initFn, wipeCache)
    }
    const key = keyFn(...args)
    if (cache[key]) {
      return cache[key]
    }

    const result = valueFn(...args)
    if (!shouldCache || shouldCache(result, ...args)) {
      cache[key] = result
    }

    return result
  }
}

export default {
  create,
}
