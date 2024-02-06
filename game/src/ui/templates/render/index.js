import renderAst from './render'

// renders a template from an AST
export default ast => {
  const { data, render } = renderAst(ast)

  return {
    ...data,
    render: (context = {}) => {      
      console.log('binding template, context:', data.name, context, ast)
      return render(context)
    }
  }
}
