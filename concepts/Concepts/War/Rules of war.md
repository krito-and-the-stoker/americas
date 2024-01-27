#war #map #concepts
Todo: This document contains a bit too much unrelated information, we should sort it and split that up.
## Fog of war
- There should be fog of war, and it should be visible on the map. It may not be the highest priority, but it is part of the military game and should be treated as such.
- Sneaking: Units (especially natives) should have the ability to sneak. They will move significantly slower, enter from fog of war into visibility, and have a chance not to be detected for a little bit. Some native strategies could rely on this.
## Fighting rules
- Shadowing: When two units are too close to each other, one will shadow the other. The shadowed units will not take part in any battles. This is first of all in order to avoid stacking units regularly, but also beneficial so that military units can shadow and thereby protect civil units
- fighting gets more intense towards the inside of the circle, so if an enemy unit cannot escape, it will be killed of more quickly
- when two units fight, the losing unit will be moved back in a land battle
- in a sea battle, the losing unit will be moved towards the winning, making escape harder
## General
Because of shadowing, it is important to walk within some kind of formation. This is true for the player and the enemy. This could work as follows:
The player designates a general. This could be a dragoon or soldier being promoted.
- The general can decide between two formations: line or square.
- The general is the center of the formation
- The formation is rotated towards the movement direction of the general
- Every unit gets a position in the formation and will try to go there
- The general has a switch for the stance of all units: engage, protect, hold, escape
- While in formation, units can still be moved individually
- When the general moves into a colony or fortification, the formation is disbanded and all units follow

During movement, units will automatically make sure not to shadow each other. Since this is only important for fighting, this is only considered when hostile or unknown units are somewhat close. Otherwise, units will move as normal. Units, that stand still are not taken into account.

## New Unit commands:
- Patrol
 -> Will patrol between here and destination
- Follow
 -> Follows a friendly or hostile unit

## New concept: Behaviour / Stance
- Hold
 -> Don't do anything
- Defend
 -> Will protect friendly units in strategic area by intercepting unknowns or hostiles
 -> Will not engage if no friendly is threatend
- Engage
 -> Will engage any unknowns or hostiles in strategic area on sight
- Escape
 -> Will try to avoid other hostiles


## New concept: Home Base
Every unit needs a home base. When equipment / food runs low, it will go to its home base and refill. This is applied to ships and land units and allows for reasonable (partly)automation of units, because then there is a clear way of dealing with low equipement / food, and this gives an idea of the supply range for a unit


