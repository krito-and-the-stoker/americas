const hello =`
*Hallo* {counter} **Welt**!

[if counter]
	We have a counter!
	[button action:reset] Reset []
[]


[button action:increment] Increment []

[repeat list] {.}, []

`


const tags = {
	bold: {
		begin: 'bold',
		end: 'bold',
		tokens: [{
			match: '**',
			name: 'bold'
		}],
		replace: subtree => context => <b>{subtree(context)}</b>
	},
	italic: {
		begin: 'italic',
		end:'italic',
		tokens: [{
			match: '*',
			name: 'italic'
		}],
		replace: subtree => context => <i>{subtree(context)}</i>
	},
	function: {
		begin: 'openFunction',
		end: 'closeFunction',
		tokens: [{
			match: /\[.+?\]/,
			name: 'openFunction'
		}, {
			match: '[]',
			name: 'closeFunction'
		}],
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
		tokens: [{
			match: '\n',
			name: 'newline'
		}],
		replace: () => () => <br />
	},
	indentation: {
		is: 'indentation',
		tokens: [{
			match: '\t',
			name: 'indentation'
		}, {
			match: '  ',
			name: 'indentation'
		}]
	},
	interpolate: {
		is: 'interpolation',
		tokens: [{
			match: /\{.+?\}/,
			name: 'interpolation'
		}],
		replace: (subtree, params) => context => context[params[0].trim()]
	}
}

const tokens = Object.values(tags).flatMap(tag => tag.tokens)

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
	const helloTokens = tokanize(hello)
	console.log(helloTokens)
	// const render = parse(hello)
	// return context => console.log('render') || render({
	// 	...defaultContext,
	// 	...context
	// })
	return context => 'Not yet implemented'
}
