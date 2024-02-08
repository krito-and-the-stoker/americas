---dialog---
[name: settlement.inspect]
[image: scout]
[backdrop: close]

The *{settlement.tribe.name}* seem {relation} at the moment.

[if settlement.presentGiven]
This settlement has the knowledge to train a **{expert}**.
[]
[if {not settlement.presentGiven}]
We have *not visited* this village yet.
[]


---dialog---
[name: settlement.reject]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We would rather die than feed your greed!

[answer action:threaten] As you wish! (*threaten them*) []
[answer] Never mind... []


---dialog---
[name: settlement.food.already_given]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We have already given you all we have. We cannot give you anything more this year.

[answer] So this is how you help out... []


---dialog---
[name: settlement.tax.already_given]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We have already given you and will *not submit* to these demands.

[answer] Fine, but we will come back next year. []


---dialog---
[name: settlement.tax.give]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

So be it then, take these **{amount}** [icon: good]

[answer action:take] The king will be very satisfied. []


---dialog---
[name: settlement.mission.failed]
[image: religion]
[coordinates: settlement.mapCoordinates]

Your missionary was unable to establish friendly contact with the natives and has *vanished*.

[answer action:disband] Those savages! []


---dialog---
[name: settlement.mission.success]
[image: religion]
[coordinates: settlement.mapCoordinates]

The natives join your mission *{description}*.

[answer action:establish] In Nomine Patris, et Filii, et Spiritus Sancti, *Amen*. []


---dialog---
[name: settlement.chief.hostile]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

Your people have been untrustworthy and reckless against us. We will use you for target practice.

[answer action:disband] The expedition is lost... []


---dialog---
[name: settlement.chief.welcome]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

Welcome stranger! We are well known for our **{expert}**.

We are always pleased to welcome English travelers.

[answer] Thank you []


---dialog---
[name: settlement.chief.discover]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

Welcome stranger! We are well known for our **{expert}**.

Come sit by the fire and we tell you about *nearby lands*.

[answer action:discover] Thank you []



---dialog---
[name: settlement.chief.gift]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

Welcome stranger! We are well known for our **{expert}**.

Have these valuable beads (**{worth}**[icon: gold]) as our gift.

[answer action:take] Thank you []


---dialog---
[name: settlement.live.kill]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

How dare you asking for our help when you brought so much misery to our people. *Prepare to die* for your foolishness.

[answer action:disband] Arg... []


---dialog---
[name: settlement.live.reject]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We do not feel comfortable around your people at this time. *Please leave*.

[answer] Leave []


---dialog---
[name: settlement.live.accept]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We *gladly welcome* you in our settlement.

[answer] Live with the *{settlement.tribe.name}* []


---dialog---
[name: settlement.enter.refuse]
[image: marshal]
[coordinates: settlement.mapCoordinates]

The *{settlement.tribe.name}* seem {description} and our civilians refuse to enter the settlement.

[answer] Understandable... []


---dialog---
[name: settlement.enter.scout]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

The natives are *{description}* as you approach their {settlementDescription} settlement ({settlement.population}).

[answer action:chief] Ask to speak to the chief []
[answer] Leave []


---dialog---
[name: settlement.enter.vanished]
[image: scout]
[coordinates: settlement.mapCoordinates]

Our settlers have entered the natives village. We have not heard of them ever since.

[answer action:disband] Argh.. []


---dialog---
[name: settlement.enter.insulted]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We are insulted by your presence.

[answer] Leave []


---dialog---
[name: settlement.enter.already_trained]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

We have *already shared our knowledge* with you. Now go your way and spread it amongst your people.

[answer] Leave []


---dialog---
[name: settlement.enter.train]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

You seem unskilled and do not understand the way of the nature around you. We invite you to *live among us* and we will teach you to be a **{expert}**.

[answer action:live] Live among the natives []
[answer] Leave []


---dialog---
[name: settlement.enter.criminal]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

You are unskilled and *your manners insult* our patience. We do not believe we can teach you anything.

[answer] Leave []


---dialog---
[name: settlement.enter.fellow_expert]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

Fare well fellow *{expert}*.

[answer] Leave []


---dialog---
[name: settlement.enter.other_expert]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

You are skilled and already know your way in life. We *cannot teach you* anything.

[answer] Leave []



---dialog---
[name: settlement.enter.missionary]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

The natives are *{description}* as you approach their settlement.

[answer action:mission] Establish mission []
[answer] Leave []


---dialog---
[name: settlement.enter.default]
[image: settlement.tribe.image]
[coordinates: settlement.mapCoordinates]

The natives greet you.

[answer] Leave []


---dialog---
[name: settlement.enter.military]
[image: marshal]
[coordinates: settlement.mapCoordinates]

Military units can not enter settlements for now: *not implemented*

[answer] Leave []



---dialog---
[name: settlement.no_relations]
[image: scout]
[coordinates: settlement.mapCoordinates]

We must first meet the *{settlement.tribe.name}* at land before we can enter their settlements.

[answer] Leave []

