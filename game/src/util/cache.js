import Util from 'util/util'
import Message from 'util/message'

const create = ({ initFn, keyFn, shouldCache, valueFn }) => {
  let cache = {}

  let hits = 0
  let misses = 0

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
      const initialCache = Util.execute(initFn, wipeCache)
      if (initialCache) {
        cache = initialCache
      }
      initialized = true
    }

    if (hits + misses >= 1 && (hits + misses) % 1000 === 0) {
      Message.cache.log('Cache Report\nSize', Object.keys(cache).length, 'Hits', hits, 'Misses', misses, 'Hit Rate', hits / (hits + misses))
    }

    const key = keyFn(...args)
    if (cache[key]) {
      hits++
      return cache[key]
    }
    misses++

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
