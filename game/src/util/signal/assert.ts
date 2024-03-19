import { Chain, NextFn, Context } from "./types"
import { chain } from 'util/signal/chain'

interface AssertCall<Range, Condition extends Range> {
    <V extends Range>(): Chain<V, Condition>
    <V1 extends Range, InnerFrom extends Condition & V1, V2>(element1: Chain<InnerFrom, V2>): Chain<V1 | InnerFrom, V2 | Exclude<V1, InnerFrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>): Chain<V1 | Innerfrom, V3 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>): Chain<V1 | Innerfrom, V4 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>): Chain<V1 | Innerfrom, V5 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>): Chain<V1 | Innerfrom, V6 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6, V7>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>): Chain<V1 | Innerfrom, V7 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>): Chain<V1 | Innerfrom, V8 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>): Chain<V1 | Innerfrom, V9 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>): Chain<V1 | Innerfrom, V10 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>): Chain<V1 | Innerfrom, V11 | Exclude<V1, Innerfrom>>
    <V1 extends Range, Innerfrom extends Condition & V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(element1: Chain<Innerfrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>): Chain<V1 | Innerfrom, V12 | Exclude<V1, Innerfrom>>

    (first: Chain<unknown, Condition>, ...elements: Chain<unknown, unknown>[]): Chain<unknown, unknown | Exclude<Range, Condition>>
}

type ConditionFunction<Range, Condition extends Range> = (value: Range) => value is Condition
export const assert = <Range, Condition extends Range>(condition: ConditionFunction<Range, Condition>, message?: string): AssertCall<Range, Condition> => (listen1?: Chain<Condition, any>, ...additionalListeners: Chain<any, any>[]): Chain<any, any | Exclude<Range, Condition>> => {
    if (!listen1) {
        return (next, parameter) => {
            if (!condition(parameter as any)) {
                throw new Error(`Assertion failed: ${message}` ?? 'Assertion failed')
            }

            return next(parameter)
        }
    }
    const listen = chain(listen1 as any, ...additionalListeners)
    return (next, parameter, context) => {
        if (condition(parameter as any)) {
            return listen(next, parameter, context)
        }

        return next(parameter as any)
    }
}


interface AssertNotCall<Range, Condition extends Range> {
    <V extends Range>(): Chain<V, Exclude<V, Condition>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2>(element1: Chain<InnerFrom, V2>): Chain<V1 | InnerFrom, V2 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>): Chain<V1 | InnerFrom, V3 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>): Chain<V1 | InnerFrom, V4 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>): Chain<V1 | InnerFrom, V5 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>): Chain<V1 | InnerFrom, V6 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>): Chain<V1 | InnerFrom, V7 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>): Chain<V1 | InnerFrom, V8 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>): Chain<V1 | InnerFrom, V9 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9, V10>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>): Chain<V1 | InnerFrom, V10 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>): Chain<V1 | InnerFrom, V11 | Exclude<V1, InnerFrom>>
    <V1 extends Range, InnerFrom extends Exclude<V1, Condition>, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(element1: Chain<InnerFrom, V2>, element2: Chain<V2, V3>, element3: Chain<V3, V4>, element4: Chain<V4, V5>, element5: Chain<V5, V6>, element6: Chain<V6, V7>, element7: Chain<V7, V8>, element8: Chain<V8, V9>, element9: Chain<V9, V10>, element10: Chain<V10, V11>, element11: Chain<V11, V12>): Chain<V1 | InnerFrom, V12 | Exclude<V1, InnerFrom>>

    (first: Chain<Condition, unknown>, ...elements: Chain<unknown, unknown>[]): Chain<unknown, unknown | Exclude<Range, Condition>>
}

export const assertNot = <Range, Condition extends Range>(condition: ConditionFunction<Range, Condition>, message?: string): AssertNotCall<Range, Condition> => (listen1?: Chain<Condition, unknown>, ...additionalListeners: Chain<unknown, unknown>[]) => {
    if (!listen1) {
        return (next: NextFn<unknown>, parameter: unknown) => {
            if (condition(parameter as any)) {
                throw new Error(`Assertion failed: ${message}` ?? 'Assertion failed')
            }

            return next(parameter)
        }
    }
    const listen = chain(listen1 as any, ...additionalListeners)
    return (next: NextFn<unknown>, parameter: unknown, context: Context) => {
        if (!condition(parameter as any)) {
            return listen(next, parameter, context)
        }

        return next(parameter as any)
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


