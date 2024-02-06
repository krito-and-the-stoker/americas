import { Show, For } from 'solid-js/web'
import { isFunction, evaluate } from './utils'
import resolveExpression from './expression'

const renderer = {
  text: value => () => value,
  italicTag: (_, subtree) => context => <i>{subtree(context)}</i>,
  boldTag: (_, subtree) => context => <b>{subtree(context)}</b>,
  expression: value => context => <>{resolveExpression(value)(context)}</>,
  newline: () => () => <br />,
  ignore: () => () => null,
  dialog: (_, subtree) => {
    staticContext.data.type = 'dialog'
    return context => subtree(context)
  },
  function: (value, subtree) => {
    const params = {
      subtree,
      arguments: value.args.map(exp =>
        exp.name === 'expression' ? resolveExpression(exp.value) : resolveExpression(exp)
      ),
      pairs: value.pairs,
    }

    if (!isFunction(staticContext[value.fn])) {
      console.error('Did not find function in static context:', value.fn)
      return () => null
    }

    return staticContext[value.fn](params)
  },
}

const staticSet = key => params => {
  const value = evaluate(params.arguments[0](staticContext.data))
  if (!staticContext.data) {
    console.error('Static context has no data')
  } else {
    staticContext.data[key] = value
  }
  return () => null
}

const baseStaticContext = {
  button: params =>  context => (
    <button onClick={() => params.pairs.action && context[params.pairs.action]()}>
      {params.subtree(context)}
    </button>
  ),
  if: params => context => {
    return <Show when={evaluate(params.arguments[0](context))}>{params.subtree(context)}</Show>
  },
  repeat: params => context => {
    const list = params.arguments[0](context)
    const length = () => evaluate(list).length
    return (
      <For each={evaluate(list)}>
        {(item, index) =>
          params.subtree({
            ...context,
            '.': item,
            '.index': index,
            '.first': () => index() === 0,
            '.inner': () => index() > 0 && index() < length() - 1,
            '.last': () => index() === length() - 1,
            '.length': length,
          })
        }
      </For>
    )
  },
  name: staticSet('name')
}

const renderNode = node => {
  if (renderer[node.name]) {
    const subtree = node.children ? renderGroup(node.children) : () => null
    return renderer[node.name](node.value, subtree)
  }

  console.error('Not implemented:', node.name, node)
  return () => null
}

const renderGroup = nodes => {
  const renderers = nodes.map(renderNode)
  return context => renderers.map(r => r(context))
}

let staticContext = {}
export default (node) => {
  // clear static context
  staticContext = { ...baseStaticContext, data: {} }
  return {
    data: staticContext.data,
    render: renderNode(node)
  }
}
