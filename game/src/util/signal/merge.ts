import { Listen } from "./types"


export function merge<V>(): Listen<V[], V>
export function merge<From, To>(listen1: Listen<To, From>): Listen<To, From>
export function merge<From, To1, To2>(listen1: Listen<To1, From>, listen2: Listen<To2, From>): Listen<To1 | To2, From>
export function merge<From, To1, To2, To3>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>): Listen<To1 | To2 | To3, From>
export function merge<From, To1, To2, To3, To4>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>): Listen<To1 | To2 | To3 | To4, From>
export function merge<From, To1, To2, To3, To4, To5>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>): Listen<To1 | To2 | To3 | To4 | To5, From>
export function merge<From, To1, To2, To3, To4, To5, To6>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6, From>
export function merge<From, To1, To2, To3, To4, To5, To6, To7>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>, listen7: Listen<To7, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6 | To7, From>
export function merge<From, To1, To2, To3, To4, To5, To6, To7, To8>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>, listen7: Listen<To7, From>, listen8: Listen<To8, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6 | To7 | To8, From>
export function merge<From, To1, To2, To3, To4, To5, To6, To7, To8, To9>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>, listen7: Listen<To7, From>, listen8: Listen<To8, From>, listen9: Listen<To9, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6 | To7 | To8 | To9, From>
export function merge<From, To1, To2, To3, To4, To5, To6, To7, To8, To9, To10>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>, listen7: Listen<To7, From>, listen8: Listen<To8, From>, listen9: Listen<To9, From>, listen10: Listen<To10, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6 | To7 | To8 | To9 | To10, From>
export function merge<From, To1, To2, To3, To4, To5, To6, To7, To8, To9, To10, To11>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>, listen7: Listen<To7, From>, listen8: Listen<To8, From>, listen9: Listen<To9, From>, listen10: Listen<To10, From>, listen11: Listen<To11, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6 | To7 | To8 | To9 | To10 | To11, From>
export function merge<From, To1, To2, To3, To4, To5, To6, To7, To8, To9, To10, To11, To12>(listen1: Listen<To1, From>, listen2: Listen<To2, From>, listen3: Listen<To3, From>, listen4: Listen<To4, From>, listen5: Listen<To5, From>, listen6: Listen<To6, From>, listen7: Listen<To7, From>, listen8: Listen<To8, From>, listen9: Listen<To9, From>, listen10: Listen<To10, From>, listen11: Listen<To11, From>, listen12: Listen<To12, From>): Listen<To1 | To2 | To3 | To4 | To5 | To6 | To7 | To8 | To9 | To10 | To11 | To12, From>

export function merge <From, To>(...listeners: Listen<To, From>[]): Listen<To, From> {
    return (next, parameter) => {
        return listeners.map(listen => listen(next, parameter))
    }
}
