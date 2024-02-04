const isFunction = f => typeof f === 'function'
const evaluate = expr => isFunction(expr) ? expr() : expr

const renderer = {
	text: value => context => value,
	italicTag: (value, subtree) => context => <i>{subtree(context)}</i>,
	boldTag: (value, subtree) => context => <b>{subtree(context)}</b>,
	interpolation: value => context => evaluate(context[value]),
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

const defaultContext = {
	button: (context, params) => <button onClick={() => params.action && context[params.action]()}>{params.subtree(context)}</button>,
	repeat: (context, params) => <For each={evaluate(context[params[0]])}>
		{item => params.subtree({
			...context,
			'.': item
		})}</For>,
	if: (context, params) => <Show when={evaluate(context[params[0]]())}>{params.subtree(context)}</Show>
}

export default (ast) => {
	console.log('rendering', ast)
	const template = renderGroup(ast.children)
	console.log(template)

	return (context = {}) => template({
		...defaultContext,
		...context
	})
}

