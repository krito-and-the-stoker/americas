const hello =`
*Hallo* {counter} **Welt**!

[if counter]
	We have a counter!
	[button action:reset] Reset []
[]


[button action:increment] Increment []

[repeat list] {_}, []

`

// tries to match all matchers in their specified order
// if one matchers is not matched it fails
function matchAll (matchers, input) {
	let rest = input
	let children = []
	for (const fn of matchers) {
		const match = fn(rest)
		if (!match) {
			return null
		}

		children.push({
			name: match.name,
			children: match.children,
			value: match.value
		})

		rest = match.rest
	}

	return {
		children,
		rest
	}
}

// tries to match one of the matchers
// if no matchers matches, it fails
function matchOne(matchers, input) {
	let match = null

	// try to match any of the matchers
	for (const fn of matchers) {		
		match = fn(input)
		if (match) {
			return match
		}
	}

	// could not match
	return null
}

// tries to consume without matching any
// if no character can be consumed, it fails
function matchNone(matchers, input) {
	let position = 0
	while (position < input.length) {	
		const rest = input.substring(position)
		// if we matched something, we need to stop here
		if (matchers.find(fn => fn(rest))) {
			break;
		}

		// consume 1 char
		position += 1;
	}

	// we matched something immediately
	if (!position) {
		return null
	}

	// report consumption
	return {
		value: input.substring(0, position),
		rest: input.substring(position)
	}
}

const tokens = {
	template: input => {
		let match = {
			name: 'template',
			value: null,
			children: [],
			rest: input
		}

		while (match.rest) {
			const result = matchOne([
				// match.function,
				tokens.boldTag,
				// match.italic,
				// match.line,
				tokens.interpolation,
				tokens.text
			], match.rest)
			// console.log('template', match.rest, { result })

			if (result) {
				match.children.push({
					name: result.name,
					children: result.children,
					value: result.value
				})
				match.rest = result.rest
			} else {
				// could not match template
				return null
			}
		}

		return match
	},

	boldToken: input => {
		if (input.startsWith('**')) {
			return {
				name: 'boldToken',
				rest: input.substring(2)
			}
		}
	},

	boldTag: input => {
		const match = matchAll([
			tokens.boldToken,
			tokens.text,
			tokens.boldToken,
		], input)

		if (match) {
			return {
				name: 'boldTag',
				children: [match.children[1]],
				rest: match.rest
			}
		}
	},

	text: input => {
		const match = matchNone([
			tokens.boldToken,
			tokens.interpolationStart
		], input)
		// console.log('text:', input, { match })

		if (match) {
			return {
				name: 'text',
				value: match.value,
				rest: match.rest
			}
		}
	},

	interpolationStart: input => {
		if (input.startsWith('{')) {
			return {
				name: 'interpolationStart',
				rest: input.substring(1)
			}
		}
	},

	interpolationEnd: input => {
		if (input.startsWith('}')) {
			return {
				name: 'interpolationStart',
				rest: input.substring(1)
			}
		}
	},

	variable: input => {
		const re = /^\s*(\b[a-zA-Z_][0-9a-zA-Z_]*\b)\s*/
		const result = input.match(re)
		console.log('variable', input, result)
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

	interpolation: input => {
		const match = matchAll([
			tokens.interpolationStart,
			tokens.variable,
			tokens.interpolationEnd,
		], input)

		if (match) {
			return {
				name: 'interpolation',
				value: match.children[1].value,
				rest: match.rest
			}
		}
	}
}

// const tokens = [{
// 	match: '**',
// 	name: 'bold'
// }, {
// 	match: '*',
// 	name: 'italic'
// }, {
// 	match: /\[.+?\]/,
// 	name: 'openFunction'
// }, {
// 	match: '[]',
// 	name: 'closeFunction'
// }, {
// 	match: '\n',
// 	name: 'newline'
// }, {
// 	match: '\t',
// 	name: 'indentation'
// }, {
// 	match: '  ',
// 	name: 'indentation'
// }, {
// 	match: /\{.+?\}/,
// 	name: 'interpolation'
// }]

const tags = {
	bold: {
		begin: 'bold',
		end: 'bold',
		replace: subtree => context => <b>{subtree(context)}</b>
	},
	italic: {
		begin: 'italic',
		end:'italic',
		replace: subtree => context => <i>{subtree(context)}</i>
	},
	function: {
		begin: 'openFunction',
		end: 'closeFunction',
		replace: (subtree, params) => {
			const fn = params[0]
			const paramObject = {
				subtree
			}

			params.forEach((param, i) => {
				if (i > 0) {
					const [key, value] = param.split(':')
					if (typeof value === 'undefined') {
						paramObject[i - 1] = key;
						paramObject[key] = true;
					} else {
						paramObject[key] = value;
					}
				}
			})
			console.log(fn, paramObject)

			return context => context[fn](context, paramObject)
		}
	},
	newline: {
		is: 'newline',
		replace: () => () => <br />
	},
	indentation: {
		is: 'indentation',
	},
	interpolate: {
		is: 'interpolation',
		replace: (subtree, params) => context => context[params[0].trim()]
	}
}


const matchStart = (str, expr) => {
	if (typeof expr === 'string') {
		const match = str.startsWith(expr)
		if (match) {
			return expr.length
		}

		return 0
	} else {
		const re = new RegExp('^' + expr.source);
		const match = str.match(re)
		if (match) {
			return match[0].length
		}

		return 0
	}
}

const tokanize = input => {
	let tokenList = []
	let position = 0
	let unused = ''
	while (position < input.length) {
		const str = input.substring(position)

		let match = 0
		let newToken = null
		for (const token of tokens) {
			match = matchStart(str, token.match)
			if (match > 0) {
				if (unused) {
					tokenList.push({
						name: 'unmatched',
						value: unused
					})
					unused = ''
				}
				tokenList.push({
					name: token.name,
					value: str.substring(0, match)
				})

				position += match

				break
			}
		}

		if (!match) {
			unused += str.substring(0, 1)
			position += 1
		}
	}

	return tokenList
}

const tagReplace = chunk => {
	const tag = Object.values(tags).find(t => chunk.match(new RegExp(tagExpOuter(t))))
	if (tag) {
		const content = chunk.match(new RegExp(tagExpContent(tag)))[1]
		const subtree = content
			? parse(content)
			: () => null

		const param = tag.param && chunk.match(new RegExp(tagExpParam(tag)))[1]
		const result = tag.replace(subtree, param?.split(' '))

		return result
	}

	return () => chunk
}
const parse = text => {
	const nodes = text.split(splitRegex).filter(x => !!x).map(tagReplace);
	return context => nodes.map(node => node(context))
}

const isFunction = f => typeof f === 'function'
const evaluate = expr => isFunction(expr) ? expr() : expr

const defaultContext = {
	button: (context, params) => <button onClick={() => params.action && context[params.action]()}>{params.subtree(context)}</button>,
	repeat: (context, params) => <For each={evaluate(context[params[0]])}>
		{item => params.subtree({
			...context,
			'.': item
		})}</For>,
	if: (context, params) => <Show when={evaluate(context[params[0]]())}>{params.subtree(context)}</Show>
}

export default () => {
	const helloTokens = tokens.template(hello)
	console.log(helloTokens)
	// const render = parse(hello)
	// return context => console.log('render') || render({
	// 	...defaultContext,
	// 	...context
	// })
	return context => 'Not yet implemented'
}
