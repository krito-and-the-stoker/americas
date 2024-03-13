import type { EffectFn, Listen, BasicSignal } from 'util/signal/types'
import * as primitive from './primitive'

export function key<O extends Object, Key extends keyof O>(key: Key): Listen<O[Key], O> {
    return (resolve: EffectFn<O[Key]>, obj: O) => {
        return objectListener(obj, key)(resolve)
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
        signals[key as string] = primitive.create(obj[key])

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