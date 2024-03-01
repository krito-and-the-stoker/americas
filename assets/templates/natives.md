---dialog---
[name: natives.establish]
[image: tribe.image]

Hello strange men from the sea.

We are the **{tribe.name}** and live here in *{numSettlements} settlements*. We welcome you on our land. Would you like to join our *peace* ceremony?

[answer action:yes] yes []
[answer action:no] no []


---dialog---
[name: natives.visit_colony]
[image: tribe.image]
[coordinates: colony.mapCoordinates]

You have made quite some progress with your village called **{colony.name}**. The *{tribe.name}* want to help you and gift you these **{amount}**[icon: good].

[answer action:take] Thank you []
