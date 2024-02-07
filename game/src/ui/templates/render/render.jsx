import { Show, For } from 'solid-js/web'
import { unwrap } from 'solid-js/store'
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

    if (value.fn === 'center_map') {
      console.log('center_map rendering', value)
    }

    return staticContext[value.fn](params)
  },
}

const staticSet = key => params => {
  const value = evaluate(params.arguments[0]({}))
  if (!staticContext.data) {
    console.error('Template error: Static context has no data while setting key', key, 'to', value)
  } else {
    staticContext.data[key] = value
  }
  return () => null
}
const staticExecute = key => params => {
  const fn = staticContext.functions[key]
  if (!isFunction(fn)) {
    console.error('Template error: Cannot execute from static context:', key, 'is', fn)
    return  null
  }

  return context => {
    const values = unwrap(params.arguments.map(param => evaluate(param(context))))
    fn(...values)
    return null
  }
}

const baseStaticContext = {
  button: params => context => (
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
            '&': {
              '&': item,
              'index': index,
              'first': () => index() === 0,
              'inner': () => index() > 0 && index() < length() - 1,
              'last': () => index() === length() - 1,
              'length': length,
            }
          })
        }
      </For>
    )
  },
  name: staticSet('name'),
  image: staticSet('image'),
  center_map: staticExecute('center_map')
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
export default (node, context = {}) => {
  // clear static context
  staticContext = { ...baseStaticContext, data: {}, functions: {}, ...context }
  return {
    data: staticContext.data,
    render: renderNode(node)
  }
}
