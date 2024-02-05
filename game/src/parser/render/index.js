import { staticContext, renderGroup } from './render'

export default ast => {
  console.log('rendering', ast)
  const template = renderGroup(ast.children)

  return (context = {}) =>
    console.log('binding template', template) ??
    template({
      ...staticContext,
      ...context,
    })
}
