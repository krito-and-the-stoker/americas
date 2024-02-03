const input = `
*Hallo* {counter} **Welt**!

[if counter] We have a counter!

[answer action:increment] Increment
[answer action:reset] Reset

[repeat list] {.}, 

`


const tags = {
	bold: {
		begin: '\\*\\*',
		end:'\\*\\*',
		replace: (subtree) => context => <b>{subtree(context)}</b>
	},
	italic: {
		begin: '\\*',
		end:'\\*',
		replace: (subtree) => context => <i>{subtree(context)}</i>
	},
	function: {
		begin: '\\[',
		param: '\\]',
		end: '\n',
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

			return context => context[fn](context, paramObject)
		}
	},
	newline: {
		begin: '\n',
		replace: () => () => <br />
	},
	interpolate: {
		begin: '\{',
		param: '\}',
		replace: (subtree, params) => context => context[params[0].trim()]
	},
}


const tagExpOuter = tag => {
	if (tag.param && tag.end) {
		return `(${tag.begin}.*?${tag.param}.*?${tag.end})`
	}
	if (tag.end) {
		return `(${tag.begin}.*?${tag.end})`
	}
	if (tag.param) {
		return `(${tag.begin}.*?${tag.param})`
	}
	return `(${tag.begin})`
}

const tagExpContent = tag => {
	if (tag.param && tag.end) {
		return `${tag.begin}.*?${tag.param}(.*?)${tag.end}`
	}
	if (tag.end) {
		return `${tag.begin}(.*?)${tag.end}`
	}
	if (tag.param) {
		return `${tag.begin}.*?${tag.param}`
	}
	return `${tag.begin}`
}

const tagExpParam = tag => {
	if (tag.param && tag.end) {
		return `${tag.begin}(.*?)${tag.param}.*?${tag.end}`
	}
	if (tag.end) {
		return `${tag.begin}.*?${tag.end}`
	}
	if (tag.param) {
		return `${tag.begin}(.*?)${tag.param}`
	}
	return `${tag.begin}`
}

const splitRegex = new RegExp(Object.values(tags).map(tagExpOuter).join('|'))

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
	answer: (context, params) => <button onClick={() => params.action && context[params.action]()}>{params.subtree(context)}</button>,
	repeat: (context, params) => <For each={evaluate(context[params[0]])}>
		{item => params.subtree({
			...context,
			'.': item
		})}</For>,
	if: (context, params) => <Show when={evaluate(context[params[0]]())}>{params.subtree(context)}</Show>
}

export default () => {
	const render = parse(input)
	return context => console.log('render') || render({
		...defaultContext,
		...context
	})
}
