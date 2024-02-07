[dialog]
[name: complex]
{1 + 2 + 3 + 4 + 5}
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

[if counter]
	We have a counter!

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
