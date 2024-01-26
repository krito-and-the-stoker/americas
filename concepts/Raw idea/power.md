#colonists #new-world #concepts
Each colonist has a certain power. This is a number, that initially in Europe is assigned randomly. At the time of assignment, different kinds of immigration will give bonuses or maluses for immigrants:
- When they are promised land, they will get a power bonus
- When they are criminals, they will get a severe power malus
- When coming as indentured servants, they will get a power malus
- when they come as slaves, there power is 0

In each colony, the power is slowly transfered from those with lower power towards those with bigger power. Those without power are not part of the transfer. Per transfer cycle, the colonists will be sorted by power, and then everybody takes one power from everyone with lower power, except those who have none.
Example:
100 70 66 50 33 15 0 0
+5  +4 +3 +2 +1 +0
-0  -1 -2 -3 -4 -5
105 73 67 49 29 10 0 0

Certain jobs or colonist states can give a temporary power bonus or malus.

Power plays an important role in resource distribution and reservation:

1. Every colonist takes wanted resources into his storage:
 - power * 10x of what he needs
 - most powerful reserves first, when resource is empty nothing is reserved.
2. 