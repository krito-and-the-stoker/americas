import { Show, For } from 'solid-js/web';
import { isFunction, evaluate } from './utils';
import resolveExpression from './expression';

const renderer = {
	text: value => () => value,
	italicTag: (_, subtree) => context => <i>{subtree(context)}</i>,
	boldTag: (_, subtree) => context => <b>{subtree(context)}</b>,
	expression: value => context => <>{resolveExpression(value)(context)}</>,
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


export const staticContext = {
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
				'_index': index,
				'_first': () => index() === 0,
				'_inner': () => index() > 0 && index() < length() - 1,
				'_last': () => index() === length() - 1,
				'_length': length,
			})}</For>)
	}
}

export const renderNode = node => {
	if (renderer[node.name]) {
		const subtree = node.children
			? renderGroup(node.children)
			: () => null
		return renderer[node.name](node.value, subtree)
	}

	console.log('Not implemented:', node.name, node)
	return () => null
}

export const renderGroup = nodes => {
	const renderers = nodes.map(renderNode)
	return context => renderers.map(r => r(context))
}

