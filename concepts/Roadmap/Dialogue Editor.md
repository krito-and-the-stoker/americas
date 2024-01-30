We need some kind of Dialogue Editor system, that allows non-developers to edit dialogues. Because dialogs are statice, we can compile them into javascript function at compile time. This is good for performance and we can check for errors without navigating to the dialog in the game.

We will use a template language, that looks something like this:
### Syntax
```
*italic* 
**bold**
// comment, will not be rendered
{variable: value} // sets the value of a variable
{variable} // reads the value of a variable
[setting: value]
[fn singleArgument]
[fn argument1:value1 argument2:value2] content
[fn argument:value]
	content
```
### Data Types
These data types are allowed:
- String
- Boolean
- List
- Object
### Functions
- dialog: no parameters, starts the definition of a dialog
- template: defines a reusable template
- repeat: will repeat a block of code for every item in a given list
- if: will only show a block 
- answer: renders an option to choose as an answer
- icon: display an icon
- table, space: creates a table with space in-between the items
### Settings
- name: Every dialog needs a name so it is clear when to show it
- format: choose from a list of pre-formatted options: default, wide, fullscreen
- image: an image to show
- background: a fullscreen image to show in the background
### Examples

#### Simple example
```
[dialog]
[name: Hello world]
[format: wide]
{world: World}
Hello {world}!

[answer default] Ok
```
#### Example of a dialog flow
```
[dialog]
[name: Ask me something]

[if {answer}]
	You said {answer}
[else]
	Say something
[answer default] Exit please
[answer action:dialog:{answer:Hello}] Hello
[answer action:dialog:{answer:Goodbye}] Goodbye
```

#### Buying land from the natives when in the colony
```
[template price] {price}[icon gold]

[dialog]
[name: Buy Land from Natives]
[image: {tribe.image}]
We *already use* this land and will appreciate if *you stay clear* of it.

[answer default] We will *respect your wishes*
[answer action:buy] We offer you **[price {price}]** as a *compensation*.
[answer action:claim] We have *rightfully claimed* this land for the crown of England and will use it.
```
### Construction menu
```
[template goods]
  [repeat {goods}]
    {.amount}[icon {.name}]

[dialog]
[name: Construction]
[format: wide]
What would you like to *construct*?

[answer default] **No construction**
[repeat {choices}]
	[answer action:{.action}] [table] {.label} [space] ([goods {.cost}])
```
### Purchase options in Europe
```
[dialog]
[name: Purchase]
What would you like to purchase?

[answer default] Nothing at the moment
[repeat {options}]
	[answer action:purchase:{.unit} disabled:{.disabled}]
		[table] {.name} [space] {.price} [icon gold]
```
### Click on Settlement
```
[dialog]
[name: Settlement]

[if {relation}]
	The *{tribe}* in this settlement are **{relation}** at the moment.

[if {expert}] This settlement has the knowledge to train a **{expert}**.
[else] We have *not visited* this village yet.
```
