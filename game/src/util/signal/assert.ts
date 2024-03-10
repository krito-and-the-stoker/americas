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
    <V1 extends Range, V2>(listen1: Listen<V2, Condition>): Listen<V2 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>): Listen<V3 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7, V8>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7, V8, V9>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9 | Except<Range, Condition>, V1>
    <V1 extends Range, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen1: Listen<V2, Condition>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10 | Except<Range, Condition>, V1>

    (listen1: Listen<unknown, Condition>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Except<Range, Condition>, unknown>
}

type ConditionFunction<Range, Condition extends Range> = (value: Range) => value is Condition
export const assert = <Range, Condition extends Range>(condition: ConditionFunction<Range, Condition>): AssertCall<Range, Condition> => (listen1?: Listen<any, Condition>, ...additionalListeners: Listen<any, any>[]): Listen<any | Except<Range, Condition>, any> => {
    if (!listen1) {
        return (resolve, value) => {
            if (!condition(value as any)) {
                throw new Error('Assertion failed')
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

export const assertError = assert((value): value is Error => value instanceof Error)

// export const assertHasValue = assert((value): value is NonNullable<any> => value !== undefined && value !== null)
