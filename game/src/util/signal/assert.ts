import { Listen, EffectFn } from "./types"
import { chain } from 'util/signal/chain'

interface AssertCall<Range, Condition extends Range> {
    <V extends Range>(): Listen<Condition, V>
    <V1 extends Range, InnerFrom extends Condition & V1, V2>(listen1: Listen<V2, InnerFrom>): Listen<V2 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>): Listen<V3 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): Listen<V11 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): Listen<V12 | Exclude<V1, InnerFrom>, InnerFrom | V1>

    (listen1: Listen<unknown, Condition>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Exclude<Range, Condition>, unknown>
}

type ConditionFunction<Range, Condition extends Range> = (value: Range) => value is Condition
export const assert = <Range, Condition extends Range>(condition: ConditionFunction<Range, Condition>, message?: string): AssertCall<Range, Condition> => (listen1?: Listen<any, Condition>, ...additionalListeners: Listen<any, any>[]): Listen<any | Exclude<Range, Condition>, any> => {
    if (!listen1) {
        return (resolve, value) => {
            if (!condition(value as any)) {
                throw new Error(`Assertion failed: ${message}` ?? 'Assertion failed')
            }

            return resolve(value)
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


interface AssertNotCall<Range, Condition extends Range> {
    <V extends Range>(): Listen<Exclude<V, Condition>, V>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2>(listen1: Listen<V2, InnerFrom>): Listen<V2 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>): Listen<V3 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): Listen<V11 | Exclude<V1, InnerFrom>, InnerFrom | V1>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen1: Listen<V2, InnerFrom>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): Listen<V12 | Exclude<V1, InnerFrom>, InnerFrom | V1>

    (listen1: Listen<unknown, Condition>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Exclude<unknown, Condition>, unknown>
}

export const assertNot = <Range, Condition extends Range>(condition: ConditionFunction<Range, Condition>, message?: string): AssertNotCall<Range, Condition> => (listen1?: Listen<unknown, Condition>, ...additionalListeners: Listen<unknown, unknown>[]) => {
    if (!listen1) {
        return (resolve: EffectFn<unknown>, value: unknown) => {
            if (condition(value as any)) {
                throw new Error(`Assertion failed: ${message}` ?? 'Assertion failed')
            }

            return resolve(value)
        }
    }
    const listen = chain(listen1 as any, ...additionalListeners)
    return (resolve: EffectFn<unknown>, value: unknown) => {
        if (!condition(value as any)) {
            return listen(resolve, value)
        }

        return resolve(value as any)
    }
}

export const isNothing = assert((value): value is undefined | null => value === undefined || value === null, 'Value is not nothing')
export const isNumber = assert((value): value is number => typeof value === 'number', 'Value is not a number')
export const isArray = assert((value): value is any[] => Array.isArray(value), 'Value is not an array')
export const isBoolean = assert((value): value is boolean => typeof value === 'boolean', 'Value is not a boolean')
export const isString = assert((value): value is string => typeof value === 'string', 'Value is not a string')
export const isFunction = assert((value): value is Function => typeof value === 'function', 'Value is not a function')
export const isObject = assert((value): value is object => typeof value === 'object', 'Value is not an object')
export const isError = assert((value): value is Error => value instanceof Error, 'Value is not an error')

export const isNotNothing = assertNot((value): value is undefined | null => value === undefined || value === null, 'Value is nothing')
export const isNotNumber = assertNot((value): value is number => typeof value === 'number', 'Value is a number')
export const isNotArray = assertNot((value): value is any[] => Array.isArray(value), 'Value is an array')
export const isNotBoolean = assertNot((value): value is boolean => typeof value === 'boolean', 'Value is a boolean')
export const isNotString = assertNot((value): value is string => typeof value === 'string', 'Value is a string')
export const isNotFunction = assertNot((value): value is Function => typeof value === 'function', 'Value is a function')
export const isNotObject = assertNot((value): value is object => typeof value === 'object', 'Value is an object')
export const isNotError = assertNot((value): value is Error => value instanceof Error, 'Value is an error')


