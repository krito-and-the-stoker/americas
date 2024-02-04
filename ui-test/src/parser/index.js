import generateAst from './ast';
import renderTemplate from './render'

const hello =`
*Hallo {counter}* **Welt**!

[if counter]
	We have a counter!

	[button action:reset] Reset []
[]

[button action:increment] Increment []

`

export default () => {
	const ast = generateAst(hello);
	return renderTemplate(ast)
}