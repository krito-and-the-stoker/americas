import { matchAll, matchOne, matchNone, matchRepeat, matchRepeatOptional, describeTag } from './combinators.js'

const baseTokens = {
  dialogTag: input => {
    const lengthOfFirstLine = input.indexOf('\n')
    if (input.startsWith('[dialog]')) {
      return {
        name: 'dialogTag',
        // ignore everything after dialog including the newline symbol
        rest: input.substring(lengthOfFirstLine + 1),
      }
    }
  },

  italicUnderscore: input => {
    if (input.startsWith('_')) {
      return {
        name: 'italicUnderscore',
        rest: input.substring(1),
      }
    }
  },

  italicStar: input => {
    if (input.startsWith('*')) {
      return {
        name: 'italicStar',
        rest: input.substring(1),
      }
    }
  },

  boldToken: input => {
    if (input.startsWith('**')) {
      return {
        name: 'boldToken',
        rest: input.substring(2),
      }
    }
  },

  fnOpen: input => {
    if (input.startsWith('[')) {
      return {
        name: 'fnOpen',
        rest: input.substring(1),
      }
    }
  },

  fnClose: input => {
    if (input.startsWith(']')) {
      return {
        name: 'fnClose',
        rest: input.substring(1),
      }
    }
  },

  doubleDot: input => {
    if (input.startsWith(':')) {
      return {
        name: 'doubleDot',
        rest: input.substring(1),
      }
    }
  },

  interpolationOpen: input => {
    if (input.startsWith('{')) {
      return {
        name: 'interpolationOpen',
        rest: input.substring(1),
      }
    }
  },

  interpolationClose: input => {
    if (input.startsWith('}')) {
      return {
        name: 'interpolationClose',
        rest: input.substring(1),
      }
    }
  },

  binaryOperator: input => {
    const operators = ['+', '-', '*', '/', 'and', 'or', '==', '!=', '<', '<=', '>', '>=']
    for (const operator of operators) {
      if (input.startsWith(operator)) {
        return {
          name: 'binaryOperator',
          value: operator,
          rest: input.substring(operator.length),
        }
      }
    }
  },

  unaryOperator: input => {
    const operators = ['not']
    for (const operator of operators) {
      if (input.startsWith(operator)) {
        return {
          name: 'unaryOperator',
          value: operator,
          rest: input.substring(operator.length),
        }
      }
    }
  },

  booleanConstant: input => {
    const re = /^\s*(true|false)\s*/
    const result = input.match(re)
    if (result) {
      const all = result[0]
      const value = result[1] === 'true'
      return {
        name: 'booleanConstant',
        value,
        rest: input.substring(all.length),
      }
    }
  },

  numberConstant: input => {
    const re = /^\s*([0-9]+(\.[0-9]+)?)\s*/
    const result = input.match(re)
    if (result) {
      const all = result[0]
      const value = parseFloat(result[1])
      return {
        name: 'numberConstant',
        value,
        rest: input.substring(all.length),
      }
    }
  },

  key: input => {
    const re = /^\s*([a-zA-Z_][0-9a-zA-Z_]*)/
    const result = input.match(re)
    if (result) {
      const all = result[0]
      const key = result[1]
      return {
        name: 'key',
        value: key,
        rest: input.substring(all.length),
      }
    }
  },

  whitespace: input => {
    const re = /^\s+/
    const result = input.match(re)
    if (result) {
      const all = result[0]
      return {
        name: 'whitespace',
        rest: input.substring(all.length),
      }
    }
  },

  variable: input => {
    const re = /^\s*([a-zA-Z_\.][0-9a-zA-Z_\.]*)\s*/
    const result = input.match(re)
    if (result) {
      const all = result[0]
      const variable = result[1]
      return {
        name: 'variable',
        value: variable,
        rest: input.substring(all.length),
      }
    }
  },

  indentation: input => {
    if (input.startsWith('\t')) {
      return {
        name: 'indentation',
        rest: input.substring(1),
      }
    }
    if (input.startsWith('  ')) {
      return {
        name: 'indentation',
        rest: input.substring(2),
      }
    }
  },

  newline: input => {
    if (input.startsWith('\n')) {
      return {
        name: 'newline',
        rest: input.substring(1),
      }
    }
  },

  // be careful with this one:
  // it allows you to match nothing and consume nothing
  // use this for optional elements:
  // matchOne([token.iAmOptional, token.empty])
  empty: input => {
    return {
      name: 'empty',
      rest: input,
    }
  }
}

const tokens = new Proxy(baseTokens, {
  get: (target, prop, receiver) => {
    return (...args) => {
      // Check if the property is still a function when invoked
      if (typeof target[prop] === 'function') {
        return target[prop].apply(receiver, args)
      } else {
        throw new Error(`Property '${prop}' does not exist`)
      }
    }
  },
  set: (target, prop, value) => {
    // Allow setting new properties or changing existing ones
    target[prop] = value
    return true
  },
})

tokens.nonTextContentElement = matchOne([
  tokens.boldTag,
  tokens.italicTag,
  tokens.interpolation,
  tokens.indentedNewline,
  tokens.newline,
  tokens.function,
])
tokens.content = matchRepeat(matchOne([tokens.nonTextContentElement, tokens.text]))

tokens.dialog = describeTag(match => {
  const children = match.children[1].children
    .reverse()
    .filter((node, i, all) => {
      if (node.name === 'newline' && all.slice(0, i).every(before => before.name === 'newline')) {
        return false
      }

      return true
    })
    .reverse()

  return {    
    name: 'dialog',
    children,
  }
}, matchAll([
  tokens.dialogTag,
  tokens.content
]))

tokens.allDialogs = describeTag(match => {
  if (match.rest) {
    console.error('Could not handle input:', match.rest)
  }

  return {    
    name: 'dialogs',
    value: match.children[1].children,
    children: null
  }
}, matchAll([
  matchOne([
    tokens.content,
    tokens.empty,
  ]),
  matchRepeat(tokens.dialog)
]))

tokens.template = input => {
  let rest = input
  let children = []
  while (rest.length > 0) {
    const match = tokens.content(rest)
    // console.log('template', { input }, { match })
    if (match) {
      children = children.concat(match.children)
      if (!match.rest) {
        return {
          name: 'template',
          children,
        }
      } else {
        rest = match.rest.substring(1)
        console.error('Unexpected input, ignoring next character: ', match.rest)
      }
    } else {
      console.error('Unexpected input, ignoring next character: ', rest)
      rest = rest.substring(1)
    }
  }
}

tokens.indentedNewline = describeTag(
  match => ({
    name: match.children[1].children.length === 1 ? 'text' : 'ignore',
    children: null,
    value: ' ',
  }),
  matchAll([tokens.newline, matchRepeat(tokens.indentation)])
)

tokens.italicTag = describeTag(
  match => ({
    name: 'italicTag',
    children: match.children[1].children,
  }),
  matchOne([
    matchAll([tokens.italicStar, tokens.content, tokens.italicStar]),
    matchAll([tokens.italicUnderscore, tokens.content, tokens.italicUnderscore])
  ])
)

tokens.boldTag = describeTag(
  match => ({
    name: 'boldTag',
    children: match.children[1].children,
  }),
  matchAll([tokens.boldToken, tokens.content, tokens.boldToken])
)

tokens.italicToken = matchOne([
  tokens.italicStar,
  tokens.italicUnderscore
])

tokens.text = describeTag(
  match => ({
    name: 'text',
    value: match.value,
  }),
  matchNone([
    tokens.italicToken,
    tokens.boldToken,
    tokens.interpolationOpen,
    tokens.fnOpen,
    tokens.newline,
  ])
)

tokens.constant = describeTag(
  match => ({
    name: 'constant',
    value: match.value,
  }),
  matchOne([tokens.booleanConstant, tokens.numberConstant])
)

tokens.value = matchOne([tokens.constant, tokens.variable])

tokens.expression = describeTag(
  match => {
    if (['variable', 'constant'].includes(match.name)) {
      return {
        name: match.name,
        value: match.value,
      }
    }

    if (match.children[0].name === 'unaryOperator') {
      return {
        name: 'unaryOperator',
        value: {
          operator: match.children[0].value,
          operand: {
            name: match.children[1].name,
            value: match.children[1].value,
          },
        },
        children: null,
      }
    }

    return {
      name: 'binaryOperator',
      value: {
        operator: match.children[1].value,
        leftOperand: match.children[0],
        rightOperand: match.children[2],
      },
      children: null,
    }
  },
  matchOne([
    matchAll([tokens.value, tokens.binaryOperator, tokens.expression]),
    matchAll([tokens.unaryOperator, tokens.expression]),
    tokens.value,
  ])
)

tokens.interpolation = describeTag(
  match => ({
    name: 'expression',
    value: match.children[1],
    children: null,
  }),
  matchAll([tokens.interpolationOpen, tokens.expression, tokens.interpolationClose])
)

tokens.pair = describeTag(
  match => ({
    name: 'pair',
    children: null,
    value: {
      key: match.children[0].value,
      value: match.children[2].value,
    },
  }),
  matchAll([tokens.key, tokens.doubleDot, tokens.variable])
)

tokens.simpleFunction = describeTag(
  match => {
    const fn = match.children[1].value
    const params = match.children[4].children
    const args = params.map(p => {
      if (p.name === 'variable') {
        return {
          ...p,
          name: 'constant',
        }
      }

      return p
    })

    return {
      name: 'function',
      value: {
        fn,
        args: match.children[4].children,
      },
      children: null,
    }
  },
  matchAll([
    tokens.fnOpen,
    tokens.key,
    tokens.doubleDot,
    matchRepeatOptional(tokens.whitespace),
    matchRepeat(matchOne([tokens.value, tokens.interpolation])),
    tokens.fnClose,
    matchRepeatOptional(tokens.newline)
  ])
)


tokens.functionWithContent = describeTag(
  match => {
    const fn = match.children[1].value
    const params = match.children[3].children
    const args = params.filter(p => p.name !== 'pair')

    const pairs = {}
    params
      .filter(p => p.name === 'pair')
      .forEach(p => {
        pairs[p.value.key] = p.value.value
      })

    return {
      name: 'function',
      value: {
        fn,
        args,
        pairs,
      },
      children: match.children[5].children,
    }
  },
  matchAll([
    tokens.fnOpen,
    tokens.key,
    matchRepeatOptional(tokens.whitespace),
    matchRepeat(matchOne([tokens.pair, tokens.value, tokens.interpolation])),
    tokens.fnClose,
    tokens.content,
    tokens.fnOpen,
    tokens.fnClose,
  ])
)

tokens.function = matchOne([tokens.simpleFunction, tokens.functionWithContent])

export default tokens
