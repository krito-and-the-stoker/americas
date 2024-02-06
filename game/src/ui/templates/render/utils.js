export const isFunction = f => typeof f === 'function'
export const evaluate = expr => (isFunction(expr) ? expr() : expr)
