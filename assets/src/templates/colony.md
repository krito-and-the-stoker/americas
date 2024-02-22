---dialog---
[name: colony.construction]
[backdrop: close]

What would you like to *construct*?

[repeat newBuildings]
	[answer action:{.start}]
		[grid columns:2]
			[cell] **{.display}** []
			[cell] [goods: {.cost}] ({.percentage}%) []
		[]
	[]
[]

[repeat upgradeBuildings]
	[answer action:{.start}]
		[grid columns:2]
			[cell] **{.display}** []
			[cell] [goods: {.cost}] ({.percentage}%) []
		[]
	[]
[]

[repeat units]
	[answer action:{.start}]
		[grid columns:2]
			[cell] **{.display}** []
			[cell] [goods: {.cost}] ({.percentage}%) []
		[]
	[]
[]

[answer action:stop] **Stop Construction** []


---dialog---
[name: colony.buyland]
[image: settlement.tribe.image]
[backdrop: close]

We *already use* this land and will appreciate if *you stay clear* of it.

[answer] We will **respect** your wishes []
[answer action:buy] We offer you **500**[icon: gold] as a *compensation*. []
[answer action:claim] We have rightfully **claimed** this land for the crown of England and will use it. []
