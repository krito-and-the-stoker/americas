import { createSignal, onCleanup } from 'solid-js'
import { createStore, reconcile } from 'solid-js/store'
import Util from 'util/util'

const create = (instance, key) => {
  const listeners = listenerKey(key)
  instance[listeners] = []
}

const remove = (instance, key, listener) => {
  listener.alive = false
  const listeners = listenerKey(key)
  if (listener.cleanup) {
    Util.execute(listener.cleanup, true)
  }
  instance[listeners] = instance[listeners].filter(l => l !== listener)
}

const listen = (instance, key, fn) => {
  const listeners = listenerKey(key)
  const value = key ? instance[key] : instance
  const cleanup = fn(value)
  const listener = {
    fn,
    cleanup,
    instance,
    key,
    alive: true,
  }

  if (!instance[listeners]) {
    create(instance, key)
  }

  instance[listeners].push(listener)
  return () => remove(instance, key, listener)
}

const pages = [new Set(), new Set()]

const add = listener => {
  pages[0].add(listener)
}

const update = (instance, key, value) => {
  const listeners = listenerKey(key)
  if (value !== undefined) {
    if (instance[key] === value) {
      return
    }
    instance[key] = value
  }
  if (instance[listeners]) {
    instance[listeners].forEach(listener => {
      add(listener)
    })
  }
}

const applyUpdate = () => {
  const scheduled = pages[0]
  pages.reverse()

  scheduled.forEach(listener => {
    if (listener.alive) {
      Util.execute(listener.cleanup, false)
      listener.cleanup = undefined

      const value = listener.key ? listener.instance[listener.key] : listener.instance
      listener.cleanup = listener.fn(value)
    }
  })
  scheduled.clear()
}

const applyAllUpdates = () => {
  while (pages[0].size > 0) {
    applyUpdate()
  }
}

const hasListener = (instance, key) => {
  const listeners = listenerKey(key)
  return instance[listeners] && instance[listeners].length > 0
}

const listenerKey = key => (key ? `${key}Listeners` : 'listeners')

const map = (mapping, fn, equals = (a, b) => a === b) => {
  let oldValue = null
  let oldCleanup = null
  const cleanup = final => {
    if (final) {
      Util.execute(oldCleanup, true)
    }
  }
  const optimizedListener = newValue => {
    const mapped = mapping(newValue)
    if (!equals(mapped, oldValue)) {
      oldValue = mapped
      Util.execute(oldCleanup)
      oldCleanup = fn(mapped)
    }

    return cleanup
  }

  return optimizedListener
}



function signal(listen, update) {
  const [signal, setSignal] = createSignal(undefined, { equals: false })
  const cleanup = listen(value => {
    setSignal(value)
  })

  onCleanup(cleanup)

  const setValue = arg => {
    if (Util.isFunction(arg)) {
      update(arg(signal()))
    } else {
      update(arg)
    }
  }

  return [signal, setValue]
}

function signalAt(entity, listen, update) {
  const boundListener = listen.bind(null, entity)
  const boundUpdate = update.bind(null, entity)
  return signal(boundListener, boundUpdate)  
}

function entitySignal(initialEntity, listeners, update) {
  const [store, setStore] = createStore({})
  let unsubscribe = null
  let entity = initialEntity

  const updateObject = (arg0, value) => {
    // update single key
    if (typeof arg0 === 'string') {
      if (!entity) {
        console.error('Cannot set value on empty entity', arg0, value)
      }

      const key = arg0
      update(entity, key, value)
    }
      
    Util.execute(unsubscribe)
    unsubscribe = null
    entity = arg0
    setStore(reconcile({}))


    // update complete value
    if (entity) {
      console.log('updating entity', entity, Object.keys(listeners))
      // runs immediately and sets all reactive values on entity
      unsubscribe = Object.entries(listeners).map(([key, listen]) =>
        listen(entity, value => {
          // console.log('setting key=value', key, value)
          setStore(key, value)
        }))
    }
  }

  updateObject(initialEntity)
  onCleanup(() => Util.execute(unsubscribe))

  return [store, updateObject]
}

export default {
  update,
  listen,
  hasListener,
  listenerKey,
  map,
  applyUpdate,
  applyAllUpdates,
  signal,
  signalAt,
  entitySignal,
}
