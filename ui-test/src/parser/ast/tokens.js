import { matchAll, matchOne, matchNone, matchRepeat, describeTag } from './combinators.js'

const baseTokens = {
	italicToken: input => {
		if (input.startsWith('*')) {
			return {
				name: 'italicToken',
				rest: input.substring(1)
			}
		}
	},

	boldToken: input => {
		if (input.startsWith('**')) {
			return {
				name: 'boldToken',
				rest: input.substring(2)
			}
		}
	},

	fnOpen: input => {
		if (input.startsWith('[')) {
			return {
				name: 'fnOpen',
				rest: input.substring(1)
			}
		}
	},

	fnClose: input => {
		if (input.startsWith(']')) {
			return {
				name: 'fnClose',
				rest: input.substring(1)
			}
		}
	},

	pairSperator: input => {
		if (input.startsWith(':')) {
			return {
				name: 'pairSperator',
				rest: input.substring(1)
			}
		}
	},

	interpolationOpen: input => {
		if (input.startsWith('{')) {
			return {
				name: 'interpolationOpen',
				rest: input.substring(1)
			}
		}
	},

	interpolationClose: input => {
		if (input.startsWith('}')) {
			return {
				name: 'interpolationClose',
				rest: input.substring(1)
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
					rest: input.substring(operator.length)
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
					rest: input.substring(operator.length)
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
				rest: input.substring(all.length)
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
				rest: input.substring(all.length)
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
				rest: input.substring(all.length)
			}
		}
	},

	indentation: input => {
		if (input.startsWith('\t')) {
			return {
				name: 'indentation',
				rest: input.substring(1)
			}
		}
		if (input.startsWith('  ')) {
			return {
				name: 'indentation',
				rest: input.substring(2)
			}
		}
	},

	newline: input => {
		if (input.startsWith('\n')) {
			return {
				name: 'newline',
				rest: input.substring(1)
			}
		}
	},
}

const tokens = new Proxy(baseTokens, {
  get: (target, prop, receiver) => {
    return (...args) => {
      // Check if the property is still a function when invoked
      if (typeof target[prop] === 'function') {
        return target[prop].apply(receiver, args);
      } else {
        throw new Error(`Property '${prop}' does not exist`);
      }
    };
  },
  set: (target, prop, value) => {
    // Allow setting new properties or changing existing ones
    target[prop] = value;
    return true;
  }
});

tokens.nonTextContentElement = matchOne([
	tokens.boldTag,
	tokens.italicTag,
	tokens.interpolation,
	tokens.indentedNewline,
	tokens.newline,
	tokens.function,
])
tokens.content = matchRepeat(matchOne([
	tokens.nonTextContentElement,
	tokens.text
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

tokens.indentedNewline = describeTag(match => ({
	name: match.children[1].children.length === 1
		? 'text'
		: 'ignore',
	children: null,
	value: ' '
}), matchAll([
	tokens.newline,
	matchRepeat(tokens.indentation),
]))

tokens.italicTag = describeTag(match => ({
	name: 'italicTag',
	children: match.children[1].children,
}), matchAll([
	tokens.italicToken,
	tokens.content,
	tokens.italicToken,
]))

tokens.boldTag = describeTag(match => ({
	name: 'boldTag',
	children: match.children[1].children,
}), matchAll([
	tokens.boldToken,
	tokens.content,
	tokens.boldToken,
]))

tokens.text = describeTag(match => ({
	name: 'text',
	value: match.value,
}), matchNone([
		tokens.italicToken,
		tokens.boldToken,
		tokens.interpolationOpen,
		tokens.fnOpen,
		tokens.newline,
]))

tokens.constant = describeTag(match => ({
	name: 'constant',
	value: match.value,
}), matchOne([
	tokens.booleanConstant,
	tokens.numberConstant,
]))

tokens.value = matchOne([
	tokens.constant,
	tokens.variable
])

tokens.expression = describeTag(match => {
	if (['variable', 'constant'].includes(match.name)) {
		return {
			name: match.name,
			value: match.value
		}
	}

	if (match.children[0].name === 'unaryOperator') {
		return {
			name: 'unaryOperator',
			value: {
				operator: match.children[0].value,
				operand: {
					name: match.children[1].name,
					value: match.children[1].value
				}
			},
			children: null
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
}, matchOne([
		matchAll([tokens.value, tokens.binaryOperator, tokens.expression]),
		matchAll([tokens.unaryOperator, tokens.expression]),
		tokens.value,
]))

tokens.interpolation = describeTag(match => ({
	name: 'expression',
	value: match.children[1],
	children: null,
}), matchAll([
	tokens.interpolationOpen,
	tokens.expression,
	tokens.interpolationClose,
]))

tokens.pair = describeTag(match => ({
	name: 'pair',
	children: null,
	value: {
		key: match.children[0].value,
		value: match.children[2].value
	}
}), matchAll([
	tokens.variable,
	tokens.pairSperator,
	tokens.variable
]))

tokens.function = describeTag(match => {
	const params = match.children[1].children
	const fn = params[0].value
	const args = params.slice(1).filter(p => p.name !== 'pair')
	
	const pairs = {}
	params.slice(1).filter(p => p.name === 'pair').forEach(p => {
		pairs[p.value.key] = p.value.value
	})

	return {		
		name: 'function',
		value: {
			fn,
			args,
			pairs
		},
		children: match.children[3].children,
	}
}, matchAll([
	tokens.fnOpen,
	matchRepeat(
		matchOne([
			tokens.pair,
			tokens.value,
			tokens.interpolation
		])
	),
	tokens.fnClose,
	tokens.content,
	tokens.fnOpen,
	tokens.fnClose,
]))

export default tokens;
