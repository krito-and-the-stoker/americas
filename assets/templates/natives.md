---dialog---
[name: natives.establish]
[image: tribe.image]

Greetings, strangers from the sea.

We are the **{tribe.name}** and live upon this land. We bid thee welcome. Wilt thou partake in our *peace* ceremony?

[answer action:yes] yes []
[answer action:no] no []


---dialog---
[name: natives.visit_colony]
[image: tribe.image]
[coordinates: colony.mapCoordinates]

We see much progress in your village, which ye call **{colony.name}**. The *{tribe.name}* wish to aid you and gift these **{amount}**[icon: good].

[answer action:take] Thank you []
