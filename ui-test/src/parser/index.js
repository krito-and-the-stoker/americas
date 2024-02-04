import generateAst from './ast';
import renderTemplate from './render'

const hello =`
*Hallo {2 + counter - 1}* **Welt**!
{greeting}
These
	words
	are
	all
	in
	the
	same
	line!

This
	is
	just
	o
		n
		e
	w
		o
		r
		d

[button action:increment] Increment []
[if counter]
	We have a counter!

	[button action:reset] Reset []
[]

[repeat list]
	{_index+counter}/{_length - counter}: {_}
	[if _first] (first) []
	[if _inner] (inner) []
	[if _last] (last) []
[]

[repeat list]
		[if _first] I like []
		[if _inner], []
		[if not:_first][if _last] and [][]
		{_}
		[if _last]. []
		[] 

`

export default () => {
	const ast = generateAst(hello);
	return renderTemplate(ast)
}