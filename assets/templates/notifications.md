---dialog---
[name: notification.unit.europe]
[image: admiral]
[backdrop: notified]

A **{unitName}** has arrived in Europe.


---dialog---
[name: notification.immigration]
[image: religion]
[backdrop: notified]

Religous unrest has caused immigration from Europe. A new **{unitName}** is waiting to be picked up in London.


---dialog---
[name: notification.unit.arrived.new_world]
[image: admiral]
[coordinates: unit.mapCoordinates]
[backdrop: notified]

A **{unitName}** arrived in the new world.


---dialog---
[name: notification.colony.construction]
[image: governor]
[backdrop: notified]

*{colony.name}* finished the construction of a **{constructionName}**.


---dialog---
[name: notification.pioneer]
[image: scout]
[coordinates: unit.mapCoordinates]
[backdrop: notified]

A *{unitName}* finished working to **{terraform}** on a tile.



---dialog---
[name: notification.rumor]
[image: scout]
[coordinates: unit.mapCoordinates]
[backdrop: notified]

A *{unitName}* has found a **rumor**.


---dialog---
[name: notification.settlement.enter]
[image: scout]
[coordinates: settlement.mapCoordinates]
[backdrop: notified]

A *{unitName}* has entered a **{settlement.tribe.name}** village.


---dialog---
[name: notification.colony.born]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

A **new colonist** has been born in *{colony.name}*.


---dialog---
[name: notification.colony.starving]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

The food storage of *{colony.name}* is empty and the settlers are **starving**! Make sure they have enough food to support themselves immediatly.


---dialog---
[name: notification.colony.died]
[image: govenor]
[coordinates: unit.mapCoordinates]
[backdrop: notified]

A {unitName} died of starvation


---dialog---
[name: notification.colony.storage.empty]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

*{colony.name}* has run out of **{good}**.


---dialog---
[name: notification.colony.storage.full]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

The storage of *{colony.name}* is **full**! Adding more goods will lead to loss.


---dialog---
[name: notification.unit.arrived.colony]
[image: admiral]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

A **{unitName}** arrived in *{colony.name}*


---dialog---
[name: notification.unit.promoted]
[image: govenor]
[coordinates: unit.mapCoordinates]
[backdrop: notified]

A colonist learned a *new profession* and is now considered a **{unitName}**.


---dialog---
[name: notification.treasure]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

We have secured the treasure worth **{unit.treasure}**[icon: gold] in *{colony.name}*. However, we need **a galleon** to transport it to Europe.


---dialog---
[name: treasure.transport]
[image: king]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

We are most pleased to learn of thy discovery of *treasure*. Might we offer to *attend to its conveyance*? The Crown, as is customary, shall claim a **modest portion** for its troubles.

[answer action:transport]
    Indeed, have it transported on our behalf (We will keep **{unit.treasure - cost} [icon: gold]**).
[]

[answer] Nay, we shall see to the safekeeping of our riches *ourselves*. []


---dialog---
[name: notification.settlement.destroyed]
[image: marshal]
[coordinates: settlement.mapCoordinates]
[backdrop: notified]

A settlement of the *{settlement.tribe.name}* has been **destroyed**. Natives flee in panic. The *{settlement.tribe.name}* swear revenge. We have found **{treasure.treasure}**[icon: gold] in the ruins.


---dialog---
[name: notification.settlement.decimated]
[image: marshal]
[coordinates: settlement.mapCoordinates]
[backdrop: notified]

A settlement of the *{settlement.tribe.name}* has been decimated tremendously.


---dialog---
[name: notification.fight]
[image: marshal]
[coordinates: defender.mapCoordinates]
[backdrop: notified]

There was a **fight**!


---dialog---
[name: notification.raid]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: notified]

There was a **raid** in **{colony.name}**. The storage has been plundered and lots of goods are missing. Try protect your cities with *armed forces*. *Stockades and forts* are greatly effective to prevent such events.


---dialog---
[name: notification.plunder]
[image: govenor]
[coordinates: colony.mapCoordinates]
[backdrop: close]

The storage of **{colony.name}** was **plundered**. **{amount}**[icon: good] are missing.


---dialog---
[name: notification.fight.result]
[image: marshal]
[coordinates: winner.mapCoordinates]
[backdrop: close]

A **{winnerName}** ({winnerStrength}) defeated a **{loserName}** ({loserStrength}) in battle.

