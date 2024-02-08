---dialog---
[name: europe.purchase]
[backdrop: close]

What would you like to *purchase*?

[repeat options]
	[answer action:{.action} disabled:{.disabled}]
		[grid columns:2]
			[cell] **{.name}** []
			[cell] {.price}[icon: gold] []
		[]
	[]
[]

[answer] Nothing at the moment. []

---dialog---
[name: europe.train]
[backdrop: close]

What would you like to *train*?

[repeat options]
	[answer action:{.action} disabled:{.disabled}]
		[grid columns:2]
			[cell] **{.name}** []
			[cell] {.price}[icon: gold] []
		[]
	[]
[]

[answer] Nobody for now. []
