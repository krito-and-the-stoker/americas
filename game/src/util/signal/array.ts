import { BasicSignal } from './types'
import * as primitive from './primitive'

// list of methods that modify the array
const methods: PropertyKey[] = [
    'copyWithin',
    'fill',
    'pop',
    'push',
    'reverse',
    'shift',
    'sort',
    'splice',
    'unshift'
]

export const observableArray = <T>(base: T[]): BasicSignal<T[]> => {
    // @ts-expect-error do not create a new signal if on already exists
    if (base.__signal__) {
        // @ts-expect-error do  not create a new signal if on already exists
        return base.__signal__
    }

    const signal = primitive.create(base)


    const handler = {
        get(target: T[], prop: PropertyKey, receiver: any) {
            if (prop === '__signal__') {
                return signal
            }

            const reflection = Reflect.get(target, prop, receiver)
            if (typeof reflection === 'function' && methods.includes(prop)) {
                return function(...args: any[]) {
                    const result = reflection.apply(target, args)
                    signal.update(target)

                    return result
                }
            }
            return reflection
        },

        set(target: T[], prop: PropertyKey, value: any, receiver: any): boolean {
            const result = Reflect.set(target, prop, value, receiver)
            // console.log('set array ', { prop: target })
            signal.update(target)
            return result
        }
    }

    return {
        ...signal,
        get value() {
            return new Proxy(signal.value, handler)
        }
    }
}

// @ts-ignore
window.observableArray = observableArray
