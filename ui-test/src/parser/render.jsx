const isFunction = f => typeof f === 'function'
const evaluate = expr => isFunction(expr) ? expr() : expr

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
		return resolveUnaryOperator(expression.value.operator, resolveExpression(expression.value.operand))
	}

	if (expression.name === 'binaryOperator') {
		return resolveBinaryOperator(expression.value.operator, resolveExpression(expression.value.leftOperand), resolveExpression(expression.value.rightOperand))
	}

	console.log(value)
	return () => null
}

const renderer = {
	text: value => () => value,
	italicTag: (_, subtree) => context => <i>{subtree(context)}</i>,
	boldTag: (_, subtree) => context => <b>{subtree(context)}</b>,
	expression: value => resolveExpression(value),
	newline: () => () => <br />,
	ignore: () => () => null,
	function: (value, subtree) => {
		const params = {
			subtree,
			arguments: value.args,
			pairs: value.pairs,
		}

		if (!isFunction(staticContext[value.fn])) {
			console.error('Did not find function in static context:', value.fn)
			return () => null
		}

		return staticContext[value.fn](params)
	}
}


const renderNode = node => {
	if (renderer[node.name]) {
		const subtree = node.children
			? renderGroup(node.children)
			: () => null
		return renderer[node.name](node.value, subtree)
	}

	console.log('Not implemented:', node.name, node)
	return () => null
}
const renderGroup = nodes => {
	const renderers = nodes.map(renderNode)
	return context => renderers.map(r => r(context))
}

const staticContext = {
	button: params => context => <button onClick={() => params.pairs.action && context[params.pairs.action]()}>{params.subtree(context)}</button>,
	if: params => context => {
		const expression = () => params.pairs.not
			? !evaluate(context[params.pairs.not])
			: evaluate(context[params.arguments[0]])
		return (<Show when={expression()}>
			{params.subtree(context)}
		</Show>)
	},
	repeat: params => context => {
		const list = context[params.arguments[0]]
		const length = () => evaluate(list).length
		return (<For each={evaluate(list)}>
			{(item, index) => params.subtree({
				...context,
				'_': item,
				'_index': () => index,
				'_first': () => index() === 0,
				'_inner': () => index() > 0 && index() < length() - 1,
				'_last': () => index() === length() - 1,
				'_length': () => length,
			})}</For>)
	}
}
// const staticContext = {
// 	button: (context, params) => <button onClick={() => params.action && context[params.action]()}>{params.subtree(context)}</button>,
// 	repeat: (context, params) => <For each={evaluate(context[params[0]])}>
// 		{item => params.subtree({
// 			...context,
// 			'.': item
// 		})}</For>,
// 	if: (context, params) => <Show when={evaluate(context[params[0]]())}>{params.subtree(context)}</Show>
// }

export default (ast) => {
	console.log('rendering', ast)
	const template = renderGroup(ast.children)

	return (context = {}) => console.log('binding template', template) ?? template({
		...staticContext,
		...context
	})
}

