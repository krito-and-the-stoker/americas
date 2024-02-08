[dialog]
[name: colony.construction]
[backdrop: close]

What would you like to *construct*?

[repeat buildings]
	[answer action:{.start}]
		[grid columns:2]
			[cell] **{.name}** []
			[cell] [goods: {.cost}] ({.percentage}%) []
		[]
	[]
[]

[repeat units]
	[answer action:{.start}]
		[grid columns:2]
			[cell] **{.name}** []
			[cell] [goods: {.cost}] ({.percentage}%) []
		[]
	[]
[]

[answer action:stop] **Stop Construction** []
