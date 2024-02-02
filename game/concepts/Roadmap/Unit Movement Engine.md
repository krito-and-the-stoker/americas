The unit movement engine currently has two modes of moving:
- *Tile based movement*
- *Vector based movement*
In *tile based movement*, the unit gets a target tile and uses pathfinding algorithms to go there. It also uses the precomputed domain dependent area to find out, if it is possible to go there, instead of trying all possible ways and fail. This is designed and works very well for movement between colonies and long distance movement in general.

*Vector based movement* means moving a unit by giving it a direction, and it will move into that direction directly. This is necessary in combat situations, where small movements can decide battles, and the indirection of a pathfinding algorithms should be avoided.

Currently *vector based movement* has a few problems:
- Can move onto invalid tiles
- Is not yet properly connected with *tile based movement*, which means it is often done somewhat on-the-fly without considering unit speed correctly

Although *tile based movement* is pretty stable, it currently lacks the possibility to avoid certain tiles. For example, we would like natives to avoid streets if they are hostile.

These Problems need to be fixed in order to develop proper AI combat algorithms and more intelligent unit commands.