import generateAst from './ast';

const hello =`
*Hallo {counter}* **Welt**!

[if counter]
	We have a counter!
	[button action:reset] Reset []
[]


[button action:increment] Increment []

[repeat list] {_}, []

`

export default () => {
	const ast = generateAst(hello);
	console.log(ast)

	return () => 'Hello World!'
}