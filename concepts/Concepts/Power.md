#colonists #new-world #concepts
Each colonist has a certain power. This is a number, that initially in Europe is assigned randomly. At the time of assignment, different kinds of immigration give bonuses or malusses for immigrants:
- When they are promised land, they will get a power bonus
- When they are criminals, they will get a severe power malus
- When coming as indentured servants, they will get a power malus
- when they come as slaves, there power is 0

In each colony, the power is slowly transferred from those with lower power towards those with bigger power. Per transfer cycle, the colonists will be sorted by power, and then everybody takes one power from everyone with lower power.
Example:
```
100 70 66 50 33 15  0  0
 +7 +6 +5 +4 +3 +2 +1
    -1 -2 -3 -4 -5 -6 -7
100 75 69 51 32 13  0  0
```

Certain jobs or colonist states can give a temporary power bonus or malus.

Power will be used to broadly simulate the effects of an unequal society.

First of all, when colonists have needs and they want to access a colonies storage, they are sorted by power, and those with the most power access first. If the storage is empty, those with less power get unlucky and cannot fulfil their needs.
