import Message from 'util/message'
import renderAst from './render'

// renders a template from an AST
export default (ast, staticContext) => {
  const { data, render } = renderAst(ast, staticContext)

  return {
    data,
    name: data.name,
    type: data.type,
    render: (context = {}) => {
      Message.templates.log('binding', data.name, context, ast)
      return render(context)
    }
  }
}
