import { createEffect } from 'solid-js'
import { Show, For } from 'solid-js/web'
import { unwrap } from 'solid-js/store'
import { isFunction, evaluate } from './utils'
import resolveExpression from './expression'
import { filterObject } from './helper'

import ObjectTree from './components/ObjectTree'
import DialogImage from './components/DialogImage'
import Answer from './components/Answer'
import CoordinatesLink from './components/CoordinatesLink'
import GameIcon from './components/GameIcon'
import Backdrop from './components/Backdrop'

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
      pairs: value.pairs && Object.fromEntries(Object.entries(value.pairs).map(
        ([key, exp]) => ([
          key,
          exp.name === 'expression' ? resolveExpression(exp.value) : resolveExpression(exp)
        ])
      )),
    }

    if (!isFunction(staticContext[value.fn])) {
      console.error('Did not find function in static context, ignore:', value.fn)
      return () => null
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

// This is currently unused, maybe we don't need that after all
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
  if: params => context => {
    return <Show when={evaluate(params.arguments[0](context))}>{params.subtree(context)}</Show>
  },
  repeat: params => context => {
    const list = params.arguments[0](context)
    const length = () => evaluate(list).length

    return (
      <For each={evaluate(list)}>
        {(item, index) => {
          const subContext = {
            'index': index,
            'first': () => index() === 0,
            'inner': () => index() > 0 && index() < length() - 1,
            'last': () => index() === length() - 1,
            'length': length,
          }

          if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
            Object.assign(subContext, item)
          } else {
            subContext['&'] = item
          }

          return params.subtree({
            ...context,
            '&': subContext,
          })
        }}
      </For>
    )
  },
  inspect: params => context => {
    const obj = () => params.arguments[0]
      ? evaluate(params.arguments[0](context))
      : context
    const filteredObj = () => filterObject(obj(), (key, value) =>
      !key?.endsWith('Listeners') && key !== 'listeners' && !isFunction(value)
    )

    console.log('Inspect:', filteredObj())

    return <ObjectTree object={filteredObj()} />
  },
  answer: params => context => (
    <Answer action={context[evaluate(params.pairs.action(context))]}>
      {params.subtree(context)}
    </Answer>
  ),
  name: staticSet('name'),
  image: params => context => <DialogImage image={evaluate(params.arguments[0](context))} />,
  coordinates: params => context => <CoordinatesLink coordinates={evaluate(params.arguments[0](context))} centerFn={staticContext.functions.centerMap} />,
  icon: params => context => <GameIcon name={evaluate(params.arguments[0](context))} />,
  backdrop: params => context => <Backdrop action={context[evaluate(params.arguments[0](context))]} />
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
  staticContext = { ...baseStaticContext, data: {}, ...context }
  return {
    data: staticContext.data,
    render: renderNode(node)
  }
}
