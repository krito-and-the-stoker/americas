[dialog]
[name: unit_goto_sea]
[image: admiral]
[backdrop: close]

Where shall we go?

  [repeat colonies]
[answer action:{.action}] **{.name}** ({.size}) []
[]
[answer action:{homeport.action}] **{homeport.name}** (Europe) []


[dialog]
[name: unit_goto_land]
[image: scout]
[backdrop: close]

Where shall we go?

  [repeat colonies]
[answer action:{.action}] **{.name}** ({.size}) []
[]


[dialog]
[name: unit_goto_americas]
[image: admiral]
[backdrop: close]

Where shall we *sail* to?

[answer action:openWaters] *Open waters* in the Americas []
[repeat colonies]
[answer action:{.action}] **{.name}** ({.size}) []
[]

[answer action:{repair.action} disabled:{repair.disabled}]
  repair ship (**{repair.cost} [icon: gold]**)
[]

[inspect: repair]

