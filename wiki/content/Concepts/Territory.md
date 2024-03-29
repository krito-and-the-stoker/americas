#new-world #map
New concept: Territory
The player and each tribe have a territory, which they consider their home land. These may overlap with each other, leading to territorial conflict. Territory is calculated as follows:
### Natives
- Every settlement + the 8 surroundings
- Every shrine + the 8 surroundings
- Every tile that connects (north and south is owned or west and east is owned)
### Europeans
- Every colony + the 8 surroundings
- Every street + 4 surroundings (no diagonals)
- Every fortification + the 8 surroundings
- Every tile that connects

When a war concludes with a peace treaty, the territory will be adapted to reflect its outcome. For example, if there is a winner, all overlapping territory will be owned by the winner.

## New concept: Hostility
Because the state of war or not war is deliberately unclear in this game, this ambigouity carries over to the units encountered in the americas. All combat units from other powers have intentions either friendly, hostile or unknown. The initial state of intentions depend on the situation of the contract. Those may include:
### Other power with peace treaty:
- encountered in neutral territory in the Americas: friendly
- encountered at sea: friendly
- encountered in own territory: unknown
- encountered in their territory: unknown
### Other power with cease fire:
- unknown
### Other power with alliance:
- friendly
### Other power at war:
- hostile
### Other power with hidden flag (pirates):
- unknown

When one of your combat units encounteres another unit with unknown intentions, the intentions will be resolved, most likely with a dialog:
- the other unit may attack (becomes hostile)
- if in your territory:
	- the other unit states it purpose
		- you allow (becomes friendly)
		- you attack (become hostile)
		- you disallow
			- the other unit attacks (becomes hostile)
			- the other unit concurs and will be escorted to the border (stays unknown)
- if in their territory:
	- same, but the other way round: you state your purpose, etc
- other hidden flag:
	- they attack (becomes hostile)
	- they negotiate, depending on the power situation either you or they pay something (becomes friendly)
- own hidden flag:
	- same as other hidden flag
- cease fire
	- chance to break cease fire

In these negotiations both units were assumed combat capabilities. A non combat unit (like a settler in natives territory) may still have unknown intentions, but if they cannot attack, they may confirm to be forced out peacfully

Once the intention is revealed, it cannot be revoked unless a premise changes, which causes a new intentions state (for example, leaving the others territory and becoming friendly, then reenter and becoming unknown again, added with a cooldown in order to prevent quick flipping).

