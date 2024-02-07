import renderAst from './render'

// renders a template from an AST
export default (ast, staticContext) => {
  const { data, render } = renderAst(ast, staticContext)

  return {
    data,
    name: data.name,
    type: data.type,
    render: (context = {}) => {      
      console.log('binding template:', data.name, context, ast)
      return render(context)
    }
  }
}
