import { Chain } from './types'
import { chain } from './chain'
import { through } from './tools'

interface CatchCall {
    <V>(listen: Chain<V, V>): Chain<V | Error, V>
    <V1, V2>(listen: Chain<V1, V2>): Chain<V1, V2 | Error>
    <V1, V2, V3>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>): Chain<V1, V3 | Error>
    <V1, V2, V3, V4>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>): Chain<V1, V4 | Error>
    <V1, V2, V3, V4, V5>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>): Chain<V1, V5 | Error>
    <V1, V2, V3, V4, V5, V6>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>): Chain<V1, V6 | Error>
    <V1, V2, V3, V4, V5, V6, V7>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>): Chain<V1, V7 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>): Chain<V1, V8 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>): Chain<V1, V9 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>): Chain<V1, V10 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>): Chain<V1, V11 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>): Chain<V1, V12 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>): Chain<V1, V13 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>): Chain<V1, V14 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>): Chain<V1, V15 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>): Chain<V1, V16 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>): Chain<V1, V17 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>, listen17: Chain<V17, V18>): Chain<V1, V18 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>, listen17: Chain<V17, V18>, listen18: Chain<V18, V19>): Chain<V1, V19 | Error>
    <V1, V2, V3, V4, V5, V6, V7, V8, V9, V10, V11, V12, V13, V14, V15, V16, V17, V18, V19, V20>(listen: Chain<V1, V2>, listen2: Chain<V2, V3>, listen3: Chain<V3, V4>, listen4: Chain<V4, V5>, listen5: Chain<V5, V6>, listen6: Chain<V6, V7>, listen7: Chain<V7, V8>, listen8: Chain<V8, V9>, listen9: Chain<V9, V10>, listen10: Chain<V10, V11>, listen11: Chain<V11, V12>, listen12: Chain<V12, V13>, listen13: Chain<V13, V14>, listen14: Chain<V14, V15>, listen15: Chain<V15, V16>, listen16: Chain<V16, V17>, listen17: Chain<V17, V18>, listen18: Chain<V18, V19>, listen19: Chain<V19, V20>): Chain<V1, V20 | Error>

    (first: Chain<unknown, unknown>, ...elements: Chain<unknown, unknown>[]): Chain<unknown, unknown | Error>
}

export const catchFn: CatchCall = (listen1?: Chain<any, any>, ...additionalListeners: Chain<any, any>[]): Chain<any, any> => {
    if (!listen1) {
        return through()
    }

    const listen = chain(listen1, ...additionalListeners)
    return (resolve, parameter, context) => {
        try {
            return listen(resolve, parameter, context)
        } catch (error) {
            return resolve(error)
        }
    }
}
