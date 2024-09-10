---dialog---
[name: colony.construction]
[backdrop: close]

What would you like to *construct*?

[repeat upgradeBuildings]
	[answer action:{.start}]
		[grid columns:2]
			[cell] **{.display}** []
			[cell] [goods: {.cost}] ({.percentage}%) []
		[]
	[]
[]

[repeat newBuildings]
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

This land *belongs to us*. We ask you to *stay away*.

[answer] We shall **honor** thy wishes. []
[answer action:buy] We offer thee **500**[icon: gold] as *compensation*. []
[answer action:claim] We have justly **claimed** this land for the Crown of England and shall put it to use. []