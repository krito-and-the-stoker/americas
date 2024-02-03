const input = `
We can *count* **{counter}**!

[repeat list] This is a {.}

[answer action:increment] Increment
`

// syntaxtic sugar
const render = something => () => something

const tags = {
	bold: {
		begin: '\\*\\*',
		end:'\\*\\*',
		replace: (content, parse) => <b>{parse(content)}</b>
	},
	italic: {
		begin: '\\*',
		end:'\\*',
		replace: (content, parse) => <i>{parse(content)}</i>
	},
	function: {
		begin: '\\[',
		param: '\\]',
		end: '\n',
		replace: (content, parse, context, params) => {
			const fn = params[0]
			const paramObject = {
				content: parse(content)
			}

			params.forEach((param, i) => {
				if (i > 0) {
					const [key, value] = param.split(':')
					if (key) {
						paramObject[key] = typeof value === 'undefined'
							? true
							: value
					} else {
						console.error(`invalid key in ${param}`)
					}
				}
			})

			return <>{context[fn](context, paramObject)}<br /></>
		}
	},
	newline: {
		begin: '\n',
		replace: () => <br />
	},
	interpolate: {
		begin: '\{',
		end: '\}',
		replace: (content, parse, context) => context[content.trim()]
	},
}

const tagExpOuter = tag => tag.end
	? tag.param
		?	`(${tag.begin}.*?${tag.param}.*?${tag.end})`
		: `(${tag.begin}.*?${tag.end})`
	: `(${tag.begin})`
const tagExpContent = tag => tag.end
	? tag.param
		?	`${tag.begin}.*?${tag.param}(.*?)${tag.end}`
		: `${tag.begin}(.*?)${tag.end}`
	: `${tag.begin}`
const tagExpParam = tag => tag.param
	? `${tag.begin}(.*?)${tag.param}.*?${tag.end}`
	: `${tag.begin}`

const splitRegex = new RegExp(Object.values(tags).map(tagExpOuter).join('|'))

const createParser = (context) => {	
	const tagReplace = chunk => {
		const tag = Object.values(tags).find(t => chunk.match(new RegExp(tagExpOuter(t))))
		if (tag) {
			const content = chunk.match(new RegExp(tagExpContent(tag)))[1]
			const param = tag.param && chunk.match(new RegExp(tagExpParam(tag)))[1]
			return tag.replace(content, parse, context, param?.split(' '))
		}

		return chunk
	}
	const parse = text => text.split(splitRegex).filter(x => !!x).map(tagReplace)

	return parse
}

const defaultContext = {
	answer: (context, params) => <button onClick={() => context[params.action]()}>{params.content}</button>,
	repeat: (context, params) => params.content,
}

export default (context) => {
	const parse = createParser({
		...defaultContext,
		...context
	});
	const result = parse(input);
	console.log('result', result)

	return result
}
