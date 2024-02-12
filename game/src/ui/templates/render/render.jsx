import { createEffect } from 'solid-js'
import { Show, For } from 'solid-js/web'
import { unwrap } from 'solid-js/store'
import { isFunction, evaluate } from './utils'
import resolveExpression from './expression'
import { filterObject } from './helper'

import ObjectTree from 'ui/components/ObjectTree'
import CoordinatesLink from 'ui/components/CoordinatesLink'
import GameIcon from 'ui/components/GameIcon'
import Grid from 'ui/components/Grid'
import StorageGoods from 'ui/components/StorageGoods'

import DialogImage from 'ui/components/dialog/DialogImage'
import Answer from 'ui/components/dialog/Answer'
import Backdrop from 'ui/components/dialog/Backdrop'


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

const resolveCtxKey = (context, expression) => expression
  ? context[evaluate(expression(context))]
  : undefined
const resolveCtxVariable = (context, expression) => expression
  ? evaluate(expression(context))
  : undefined

const baseStaticContext = {
  if: params => context => {
    return <Show when={resolveCtxVariable(context, params.arguments[0])}>{params.subtree(context)}</Show>
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
      ? resolveCtxVariable(context, params.arguments[0])
      : context
    const filteredObj = () => filterObject(obj(), (key, value) =>
      !key?.endsWith('Listeners') && key !== 'listeners' && !isFunction(value)
    )

    console.log('Inspect:', filteredObj())

    return <ObjectTree object={filteredObj()} />
  },
  answer: params => context => (
    <Answer 
      action={resolveCtxKey(context, params.pairs.action)}
      disabled={resolveCtxVariable(context, params.pairs.disabled)}
    >
      {params.subtree(context)}
    </Answer>
  ),
  name: staticSet('name'),
  image: params => context => <DialogImage image={resolveCtxVariable(context, params.arguments[0])} />,
  coordinates: params => context => <CoordinatesLink coordinates={resolveCtxVariable(context, params.arguments[0])} centerFn={staticContext.functions.centerMap} />,
  icon: params => context => <GameIcon name={resolveCtxVariable(context, params.arguments[0])} />,
  backdrop: params => context => <Backdrop action={resolveCtxVariable(context, params.arguments[0])} />,
  grid: params => context => <Grid columns={resolveCtxVariable(context, params.pairs.columns)}>{params.subtree(context)}</Grid>,
  cell: params => context => <div>{params.subtree(context)}</div>,
  goods: params => context => <StorageGoods goods={resolveCtxVariable(context, params.arguments[0])} />,
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
