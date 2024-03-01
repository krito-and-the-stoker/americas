import type { Function1 } from 'util/types'
import Message from 'util/message'

type ListenerFn<T> = Function1<T, void>;

interface Listeners {
  [name: string]: ListenerFn<any>[];
}

let listeners: Listeners = {};


const init = (name: string): void => {
  listeners[name] = [];
}


const trigger = <T>(name: string, arg: T): void => {
  Message.event.log(`Event ${name}`, arg);
  listeners[name]?.forEach(fn => fn(arg));
}


const remove = <T>(name: string, fn: ListenerFn<T>): void => {
  if (listeners[name]) {
    listeners[name] = listeners[name].filter(f => f !== fn);
  }
}


const listen = <T>(name: string, fn: ListenerFn<T>): () => void => {
  if (!listeners[name]) {
    init(name);
  }

  listeners[name].push(fn);

  return () => remove(name, fn);
}

export default {
  trigger,
  remove,
  listen,
};
