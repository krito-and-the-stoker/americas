---dialog---
[name: unit.goto.sea]
[image: admiral]
[backdrop: close]

Where shall we go?

  [repeat colonies]
[answer action:{.action}] **{.name}** ({.size}) []
[]
[answer action:{homeport.action}] **{homeport.name}** (Europe) []


---dialog---
[name: unit.goto.land]
[image: scout]
[backdrop: close]

Where shall we go?

  [repeat colonies]
[answer action:{.action}] **{.name}** ({.size}) []
[]


---dialog---
[name: unit.goto.americas]
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


---dialog---
[name: unit.goto.europe]
[image: admiral]
[coordinates: unit.mapCoordinates]
[backdrop: close]

Would you like to set sail for *Europe*?

[answer action:sail] *Yes*, steady as she goes! []
[answer] *No*, let as remain here []

