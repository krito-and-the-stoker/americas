import type { EffectFn, Listen, BasicSignal } from 'util/signal/types'
import type { Maybe } from 'util/types'
import { primitive } from './primitive'

export function key<O extends Object, Key extends keyof O>(key: Key): Listen<O[Key], O>
export function key<O extends Maybe<Object>, Key extends keyof O>(key: Key): Listen<Maybe<O[Key]>, Maybe<O>>
export function key<O extends Maybe<Object>, Key extends keyof O>(key: Key): Listen<Maybe<O[Key]>, Maybe<O>> {
    return (fn: EffectFn<Maybe<O[Key]>>, obj: Maybe<O>) => {
        if (!obj) {
            return fn(obj as undefined | null)
        }
        return objectListener(obj, key)(fn)
    }
}


export function objectListener<O extends Object, Key extends keyof O>(obj: O, key: Key): Listen<O[Key]> {
    // Check if the signal storage exists; if not, create it
    if (!obj.hasOwnProperty('__signals__')) {
        Object.defineProperty(obj, '__signals__', {
            value: {},
            enumerable: false, // Hide it from object iteration
            configurable: false, // Prevent deletion
            writable: false, // Prevent modification
        });
    }

    // Use an existing signal if available, or create a new one
    const signals: Record<string, BasicSignal<O[Key]>> = (obj as any).__signals__;
    if (!signals[key as string]) {
        signals[key as string] = primitive(obj[key])

        Object.defineProperty(obj, key, {
            get() {
                return signals[key as string].value
            },
            set(value: O[Key]) {
                signals[key as string].update(value)
            },
            enumerable: true,
            configurable: true,
        });
    }

    // Add the listener and return the cleanup function
    return signals[key as string].listen
}