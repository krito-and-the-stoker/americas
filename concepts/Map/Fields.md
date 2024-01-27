#new-world #production #map
## Basic field types
- Ocean
- Plains
- Grassland
- Prairie
- Savannah
- Hills
- Mountains
- Marsh
- Swamp
- Tundra
- Desert
- Arctic
## Forest
Forests always have a base field and are on top of that. They can be cut down. The type of forest depends on their base field:
### Mixed forest
- Plains
- Grassland
- Prairie
- Savannah
### Boreal Forest
- Tundra
### Rain Forest
- Marsh
- Swamp
### Scrub Forest
- Desert

### These fields cannot have a forest
- Hills
- Mountains
- Arctic
- Ocean
## Production
Good production in fields is categorised into
- main production
- secondary production
- possible production
These help to build a mental model of the otherwise complicated and hard to learn rules of yields. Main production is what will always yield most and will scale best on a field with buildings and experts. Secondary production will scale somewhat, but never yield very good results. Possible production enables you to produce a tiny bit of a good, that otherwise may be hard to have access.

### Ocean
Main production: food
### Plains
Main crop: food
Secondary crop: cotton
Possible crop: tobacco
### Grassland
Main Crop: tobacco
Secondary Crop: food, sugar
Possible Crop: cotton
### Prairie
Main crop: cotton
Secondary crop: food
Possible crop: tobacco, sugar
### Savannah
Main crop: sugar, food
Secondary crop: tobacco
Possible crop: cotton
### Hills
Main production: ore
Secondary production: wood
Possible production: food
### Mountains
Main production: ore
### Mixed Forest
Main production: wood, fur, food
### Boreal Forest
Main production: wood, fur
Secondary production: food
### Rain Forest
Secondary production: wood
Possible production: food
### Scrub Forest
Secondary production: food
### Marsh
Secondary production: food
Possible production: tobacco, ore
### Swamp
Secondary production: food
Possible production: sugar, ore
### Tundra
Secondary production: food
Possible production: ore
### Desert
Possible production: food
### Arctic
No production
## Yields

### Basic
Main production: 2
Secondary production: 2
Possible production: 1
#### Goods modifier
Food:
- main: +2
- secondary: +1
- possible: +1
Wood:
- main: +3
- secondary: +1
### Bonus resource
Main production: + 3
### Plowed ([[Tile improvements]])
Main production: +2
Secondary production: +1
### River
Main production: +2
Secondary production: +2
Possible production: +1
### With [[Professions]]
Main production: +4
Secondary production: +3
Possible production: +2
### [[Economic Buildings]] bonus
#### Level 1
Main production: +2
Secondary production: +1
Possible production: +1
#### Level 2
Main production: +4
Secondary production: +2
Possible production: +1
#### Level 3
Main production: +5
Secondary production: +3
Possible production: +1
## Examples
### Food
Prairie (secondary) without buildings will yield:
`secondary 2 + food 1 = 3 (6 for expert)`
Plowed plains (main) with a granary (level 1 building) will yield:
`main 2 + food 2 + plowed 2 + granary 2 = 8 (12 for expert)`
Plowed grassland (secondary) with a granary (level 1 building) will yield:
`secondary 2 + food 1 + plowed 1 + granary 1 = 5 (8 for expert)`
Forest with high stands yields:
`main 2 + food 2 + high stands 2 = 6 (no expert)`
### Wood
Mixed Forest without buildings will yield
`main 2 + wood 3 = 5 (9 for expert)`
Mixed Forest with forest trails (level 1 building) will yield:
`main 2 + wood 3 + trails 2 = 7 (11 for expert)`
Mixed Forest with river and wood lathes (level 3 building) will yield:
`main 2 + wood 3 + river 2 + lathes 5 = 12 (16 for expert)`
### Cotton
Prairie (main) without buildings yields:
`main 2 = 2 (6 for expert)`
Plowed Plains (secondary) with cotton gin (level 1) yields:
`secondary 2 + plowed 1 + gin 1 = 4 (7 for expert)`
Plowed Prairie (main) with river and spinning house (level 2) yields:
`main 2 + plowed 2 + river 3 + spinning house 4 = 11 (15 for expert)`
Savannah (possible) with cotton gin (level 1 building)
`possible 1 + gin 1 = 2 (4 for expert)`
