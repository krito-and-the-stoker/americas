import { Listen } from './types'
import { chain } from './chain'
import { through } from './tools'

interface CatchCall {
    <V>(): Listen<V, V>
    <V1, V2>(listen: Listen<V2, V1>): Listen<V2 | Error, V1>
    <V1, V2, V3>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>): Listen<V3 | Error, V1>
    <V1, V2, V3, V4>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>): Listen<V4 | Error, V1>
    <V1, V2, V3, V4, V5>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>): Listen<V5 | Error, V1>
    <V1, V2, V3, V4, V5, V6>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>): Listen<V6 | Error, V1>
    <V1, V2, V3, V4, V5, V6, V7>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>): Listen<V7 | Error, V1>
    <V1, V2, V3, V4, V5, V6, V7, V8>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>): Listen<V8 | Error, V1>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>): Listen<V9 | Error, V1>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>): Listen<V10 | Error, V1>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>): Listen<V11 | Error, V1>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen: Listen<V2, V1>, listen2: Listen<V3, V2>, listen3: Listen<V4, V3>, listen4: Listen<V5, V4>, listen5: Listen<V6, V5>, listen6: Listen<V7, V6>, listen7: Listen<V8, V7>, listen8: Listen<V9, V8>, listen9: Listen<V10, V9>, listen10: Listen<V11, V10>, listen11: Listen<V12, V11>): Listen<V12 | Error, V1>

    (listen: Listen<unknown, unknown>, ...additionalListeners: Listen<unknown, unknown>[]): Listen<unknown | Error, unknown>
}

export const catchFn: CatchCall = (listen1?: Listen<any, any>, ...additionalListeners: Listen<any, any>[]): Listen<any | Error, any> => {
    if (!listen1) {
        return through()
    }

    const listen = chain(listen1, ...additionalListeners)
    return (resolve, parameter) => {
        try {
            return listen(resolve, parameter)
        } catch (error) {
            return resolve(error)
        }
    }
}
