import { matchAll, matchOne, matchNone, matchRepeat, describeTag } from './helper.js'

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

	variable: input => {
		const re = /^\s*(\b[a-zA-Z_][0-9a-zA-Z_]*\b)\s*/
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
	tokens.newline,
	tokens.function,
])
tokens.content = matchRepeat(matchOne([
	tokens.nonTextContentElement,
	tokens.text
]))

tokens.template = input => {
	const match = tokens.content(input)
	// console.log('template', { input }, { match })
	if (match) {
		if (!match.rest) {
			return {
				name: 'template',
				children: match.children
			}
		} else {
			console.error('Could not read template, unexpected: ', match.rest)
		}
	} else {
		console.error('Could not read template, unexpected: ', input)
	}
}

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


tokens.interpolation = describeTag(match => ({
	name: 'interpolation',
	value: match.children[1].value,
	children: null,
}), matchAll([
	tokens.interpolationOpen,
	tokens.variable,
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
	const args = params.slice(1).filter(p => p.name === 'variable').map(p => p.value)
	
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
			tokens.variable,
		])
	),
	tokens.fnClose,
	tokens.content,
	tokens.fnOpen,
	tokens.fnClose,
]))


export default (input) => {
	// currently, template is the highest level entry point
	return tokens.template(input)
}


