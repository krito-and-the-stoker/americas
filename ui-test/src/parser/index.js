import generateAst from './ast';
import renderTemplate from './render'

const hello =`
*Hallo {counter}* **Welt**!

[button action:increment] Increment []
[if counter]
	We have a counter!

	[button action:reset] Reset []
[]

[repeat list]
{_index}/{_length}: {_} [if _first] (first) [] [if _inner] (inner) [] [if _last] (last) []\
[]
`

export default () => {
	const ast = generateAst(hello);
	return renderTemplate(ast)
}