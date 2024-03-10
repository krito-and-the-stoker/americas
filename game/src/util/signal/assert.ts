import { Maybe } from "util/types"
import { Listen } from "./types"
import { chain } from 'util/signal/chain'

type Except<T, U> = T extends U ? never : T

interface AssertHasValueCall {
    <V>(): Listen<V, V>
    <V1, V2>(listen1: Listen<V2, NonNullable<V1>>): Listen<Maybe<V2>, Maybe<V1>>
    <V1, V2, V3>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>): Listen<Maybe<V3>, Maybe<V1>>
    <V1, V2, V3, V4>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<Maybe<V4>, Maybe<V1>>
    <V1, V2, V3, V4, V5>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<Maybe<V5>, Maybe<V1>>
    <V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<Maybe<V6>, Maybe<V1>>
    <V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<Maybe<V7>, Maybe<V1>>
    <V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<Maybe<V8>, Maybe<V1>>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<Maybe<V9>, Maybe<V1>>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, NonNullable<V1>>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<Maybe<V10>, Maybe<V1>>

    (listen1: Listen<unknown, NonNullable<unknown>>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<Maybe<unknown>, Maybe<unknown>>
}

export const assertHasValue: AssertHasValueCall = (listen1?: Listen<unknown, NonNullable<unknown>>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<Maybe<unknown>, Maybe<unknown>> => {
    if (!listen1) {
        return (resolve, value) => {
            if (value === undefined || value === null) {
                throw new Error('Assertion failed')
            }

            return resolve(value)
        }
    }
    const listen = chain(listen1 as any, ...additionalListeners)
    return (resolve, value) => {
        const isNonNullable = (value: Maybe<unknown>): value is NonNullable<unknown> => value !== undefined && value !== null
        if (isNonNullable(value)) {
            return listen(resolve, value)
        }

        return resolve(value as any)
    }
}

interface AssertCall<Range, Condition extends Range> {
    <V extends Range>(): Listen<Condition, V>
    <V1 extends Range, V2>(listen1: Listen<V2, Condition>): Listen<V2 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>): Listen<V3 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9 | Except<V1, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10 | Except<V1, Condition>, V1>

    (listen1: Listen<unknown, Condition>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Except<Range, Condition>, unknown>
}

type ConditionFunction<Range, Condition extends Range> = (value: Range) => value is Condition
export const assert = <Range, Condition extends Range>(condition: ConditionFunction<Range, Condition>, message?: string): AssertCall<Range, Condition> => (listen1?: Listen<any, Condition>, ...additionalListeners: Listen<any, any>[]): Listen<any | Except<Range, Condition>, any> => {
    if (!listen1) {
        return (resolve, value) => {
            if (!condition(value as any)) {
                throw new Error(message ?? 'Assertion failed')
            }

            resolve(value)
        }
    }
    const listen = chain(listen1 as any, ...additionalListeners)
    return (resolve, value) => {
        if (condition(value as any)) {
            return listen(resolve, value)
        }

        return resolve(value as any)
    }
}

export const isNothing = assert((value): value is undefined | null => value === undefined || value === null, 'Value is not nothing')
export const isNotNothing = assert((value): value is NonNullable<any> => value !== undefined && value !== null, 'Value is nothing')
export const isNumber = assert((value): value is number => typeof value === 'number', 'Value is not a number')
export const isArray = assert((value): value is any[] => Array.isArray(value), 'Value is not an array')
export const isBoolean = assert((value): value is boolean => typeof value === 'boolean', 'Value is not a boolean')
export const isString = assert((value): value is string => typeof value === 'string', 'Value is not a string')
export const isFunction = assert((value): value is Function => typeof value === 'function', 'Value is not a function')
export const isObject = assert((value): value is object => typeof value === 'object', 'Value is not an object')
export const isError = assert((value): value is Error => value instanceof Error, 'Value is not an error')
export const isNotNumber = assert((value): value is Exclude<any, number> => typeof value !== 'number', 'Value is a number')
export const isNotArray = assert((value): value is Exclude<any, any[]> => !Array.isArray(value), 'Value is an array')
export const isNotBoolean = assert((value): value is Exclude<any, boolean> => typeof value !== 'boolean', 'Value is a boolean')
export const isNotString = assert((value): value is Exclude<any, string> => typeof value !== 'string', 'Value is a string')
export const isNotFunction = assert((value): value is Exclude<any, Function> => typeof value !== 'function', 'Value is a function')
export const isNotObject = assert((value): value is Exclude<any, object> => typeof value !== 'object', 'Value is an object')
export const isNotError = assert((value): value is Exclude<any, Error> => !(value instanceof Error), 'Value is an error')

// export const assertHasValue = assert((value): value is NonNullable<any> => value !== undefined && value !== null)
