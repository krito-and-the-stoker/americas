import { Chain, NextFn, CleanupExec } from "./types"

import Util from 'util/util'

export function combine<V>(): Chain<V, []>
export function combine<From, To>(element1: Chain<From, To>): Chain<From, [To]>
export function combine<From, To1, To2>(element1: Chain<From, To1>, element2: Chain<From, To2>): Chain<From, [To1, To2]>
export function combine<From, To1, To2, To3>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>): Chain<From, [To1, To2, To3]>
export function combine<From, To1, To2, To3, To4>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>): Chain<From, [To1, To2, To3, To4]>
export function combine<From, To1, To2, To3, To4, To5>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>, element5: Chain<From, To5>): Chain<From, [To1, To2, To3, To4, To5]>
export function combine<From, To1, To2, To3, To4, To5, To6>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>, element5: Chain<From, To5>, element6: Chain<From, To6>): Chain<From, [To1, To2, To3, To4, To5, To6]>
export function combine<From, To1, To2, To3, To4, To5, To6, To7>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>, element5: Chain<From, To5>, element6: Chain<From, To6>, element7: Chain<From, To7>): Chain<From, [To1, To2, To3, To4, To5, To6, To7]>
export function combine<From, To1, To2, To3, To4, To5, To6, To7, To8>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>, element5: Chain<From, To5>, element6: Chain<From, To6>, element7: Chain<From, To7>, element8: Chain<From, To8>): Chain<From, [To1, To2, To3, To4, To5, To6, To7, To8]>
export function combine<From, To1, To2, To3, To4, To5, To6, To7, To8, To9>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>, element5: Chain<From, To5>, element6: Chain<From, To6>, element7: Chain<From, To7>, element8: Chain<From, To8>, element9: Chain<From, To9>): Chain<From, [To1, To2, To3, To4, To5, To6, To7, To8, To9]>
export function combine<From, To1, To2, To3, To4, To5, To6, To7, To8, To9, To10>(element1: Chain<From, To1>, element2: Chain<From, To2>, element3: Chain<From, To3>, element4: Chain<From, To4>, element5: Chain<From, To5>, element6: Chain<From, To6>, element7: Chain<From, To7>, element8: Chain<From, To8>, element9: Chain<From, To9>, element10: Chain<From, To10>): Chain<From, [To1, To2, To3, To4, To5, To6, To7, To8, To9, To10]>
export function combine<From, To>(...listens: Chain<From, To>[]): Chain<From, To[]> {
    if (listens.length === 0) {
        return (resolve: NextFn<To[]>, value: any) => resolve([value])
    }

    return (resolve: NextFn<To[]>, parameter: From, context: any) => {
        const values: To[] = []
        let updateReady = false
        let pendingCleanup: CleanupExec = null

        const cleanup = (final: boolean = false) => {
            Util.execute(pendingCleanup, final)
            pendingCleanup = null
        }

        const updateItem = (value: To, i: number) => {
            values[i] = value

            if (!updateReady) {
              return
            }

            return [
                cleanup,
                resolve(values),
            ]
        }

        const unsubscribe = listens.map((listener, i) => listener(value => updateItem(value, i), parameter, context))
        updateReady = true
        pendingCleanup = resolve(values)

        return [unsubscribe, cleanup]
    }
}




