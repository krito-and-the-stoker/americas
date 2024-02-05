import { isFunction, evaluate } from './utils'

const resolveVariable = value => context => {
  if (typeof context[value] === 'undefined') {
    console.error('Did not find value in context:', value)
  }

  return context[value]
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

  console.log(value)
  return () => null
}

export default resolveExpression
