import generateAst from './ast';
import renderTemplate from './render'

const hello =`{1 + 2 + 3 + 4 + 5}
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

	[button action:reset] Reset {counter} -> 0 []
[]

[repeat list]
	{.index+counter}/{.length - counter}: {.}
	[if .first] (first) []
	[if .inner] (inner) []
	[if .last] (last) []
[]

[repeat list]
		[if .first] I like []
		[if .inner], []
		[if {not .first and .last}] and []
		{.}
		[if .last]. []
		[] 

`

const hello2 = `
1: [if {counter > 0}] counter is larger than 0 []
2: [if {not false}] not false []
3: [if greeting] greeting: {greeting} []
`

export default () => {
	const ast = generateAst(hello + hello2);
	return renderTemplate(ast)
}