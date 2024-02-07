import { isFunction, evaluate } from './utils'

function resolvePropertyPath(context, path) {
  // Split the path into parts separated by '.'
  // we allow empty string . notation like this: .index
  // or even a single . to express access to temporary context
  // under the hood this gets replaced with a & symbol
  const parts = path.split('.').map(x => x || '&')
  
  let current = context
  for (let i = 0; i < parts.length; i++) {
    if (current[parts[i]] === undefined) {
      return undefined
    }

    current = current[parts[i]]
  }
  
  return current
}

// resolution of a variable is context dependent
// if the variable is not available in the context
// we fallback to display the variable name
// As long as temlates are simple we should be fine here...
const resolveVariable = value => context => {
  const result = resolvePropertyPath(context, value)
  if (typeof result === 'undefined') {
    // console.log('Variable not found in context', value, context)
    return value
  }

  return result
}
const resolveUnaryOperator = (operator, operand) => {
  if (operator === 'not') {
    return context => !evaluate(operand(context))
  }

  console.error('Unknown operator:', operator)
  return operand
}

const resolveBinaryOperator = (operator, left, right) => {
  if (operator === '+') {
    return context => evaluate(left(context)) + evaluate(right(context))
  }

  if (operator === '-') {
    return context => evaluate(left(context)) - evaluate(right(context))
  }

  if (operator === '>') {
    return context => evaluate(left(context)) > evaluate(right(context))
  }

  if (operator === '<') {
    return context => evaluate(left(context)) < evaluate(right(context))
  }

  if (operator === 'and') {
    return context => evaluate(left(context)) && evaluate(right(context))
  }

  if (operator === 'or') {
    return context => evaluate(left(context)) || evaluate(right(context))
  }

  console.log('Operator not implemented:', operator)
  return left
}

const resolveExpression = expression => {
  if (expression.name === 'constant') {
    return () => expression.value
  }
  if (expression.name === 'variable') {
    return resolveVariable(expression.value)
  }
  if (expression.name === 'unaryOperator') {
    return resolveUnaryOperator(
      expression.value.operator,
      resolveExpression(expression.value.operand)
    )
  }

  if (expression.name === 'binaryOperator') {
    return resolveBinaryOperator(
      expression.value.operator,
      resolveExpression(expression.value.leftOperand),
      resolveExpression(expression.value.rightOperand)
    )
  }

  return () => null
}

export default resolveExpression
