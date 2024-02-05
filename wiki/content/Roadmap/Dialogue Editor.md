We need some kind of Dialogue Editor system, that allows non-developers to edit dialogues. Because dialogs are statice, we can compile them into javascript function at compile time. This is good for performance and we can check for errors without navigating to the dialog in the game.

Dialogs always should pause the game, and when closed resume it (if it was running before).
If there is a default answer, the dialog can be clicked away by clicking anywhere on the screen.
The action of the default answer will then be executed. It is also possible to have a default answer without content. This is, for example, to inform the player of something and let it happen once he has read the dialog and closes it.

We will use a template language, that looks something like this:
### Syntax
```
# heading 1
## heading 2
### heading 3
#### heading 4
*italic* 
**bold**
// comment, will not be rendered
{variable} // reads the value of a variable
{variable + 1} // expressions are supported
[fn: argument]
[fn: argument1 argument2]
[fn argument] With content now! []
[fn: namedArgument:value1 otherArgument:value2]
[fn singlArgument]
	Multiline content
	[nestedfn] Nested Content []
[]
[fn {not hide}] I am not hidden [] // expression as argument

Because line breaks are important, they are rendered by default, except
  indentation will prevent a line to break and instead add a white space.
  If the white space is not desired, further indentation will
  r
    e
    m
    o
    v
    e
  i
    t
    .
Indentation can be achieved with a tab symbol or 2 spaces. When not at the beginning of the line, multiple spaces will be collapsed into one space.
```
### Data Types
These data types are allowed:
- String
- Boolean
- List
- Object
- Function
### Functions
- dialog: no parameters, starts the definition of a new dialog
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
[name: hello-world]
[format: wide]

Hello {world}!
```
#### Example with dialog flow
```
[dialog]
[name: echo] // this can be triggered with action:dialog:answer-echo

[if answer]
	You said {answer}
[else:]
	Say something
[]
[answer default] Exit please []
[answer action:dialog answer:hello] Hello []
[answer action:dialog answer:goodbye] Goodbye []
```
#### Example with repeat
```
[dialog]
[name: example-with-repeat]

[repeat list]
		[if .first] I like []
		[if .inner], []
		[if {not .first and .last}] and []
		{.}
		[if .last]. []
		[] 
```
#### Example with object
```
[dialog]
[name: example-with-object]

We have {goods.food}[icon: food], {goods.gold}[icon: gold] and {goods.rum}[icon rum] in store.

[answer] Fantastic. []
```
#### Buying land from the natives when in the colony
```
[template price]
	{price}[icon: gold] // transforms [price 500] -> 500[icon gold]
[]
// the parameter to template "price" defines the templates name,
// and binds the argument to {price} so it can be used inside the template

[dialog]
[name: buy-land-from-natives]
[image: tribe.image]
We *already use* this land and will appreciate if *you stay clear* of it.

[answer default] We will *respect your wishes* []
[answer action:buy] We offer you **[price: price]** as a *compensation*. []
[answer action:claim] We have *rightfully claimed* this land for the crown of England and will use it. []
```
#### Construction menu
```
[template goods]
  [repeat goods]
    {.amount}[icon: .name]
  []
[]

[dialog]
[name: construction]
[format: wide]
What would you like to *construct*?

[repeat choices]
	[answer action:.action]
	[table] {.label} [space:] ([goods: .cost]) []
	[]
[]
	[answer default] **No construction** []
```
#### Purchase options in Europe
```
[dialog]
[name: purchase]
What would you like to purchase?

[answer default] Nothing at the moment []
[repeat options]
	[answer action:purchase answer:.unit disabled:.disabled]
		[table] {.name} [space] {.price} [icon gold] []
	[]
[]
```
#### Click on Settlement
```
[dialog]
[name: settlement]

[if relation]
	The *{tribe}* in this settlement are **{relation}** at the moment.
[]
[if expert]
	This settlement has the knowledge to train a **{expert}**.
[else:]
	We have *not visited* this village yet.
[]
```
#### Native enters a colony to trade
```
[template good] **{good.amount}[icon {good.good}]** []
[dialog]
[name: native-trade-initial]

We would like you to offer [good: offer] in exchange for [good: demand].

[answer default] Thank you we don't need any [icon: offer.good] []
[answer action:less] We can give you [good: less] []
[repeat different]
	[answer action:different answer:.good] Will you instead take [good: .]? []
[]

[dialog]
[name: native-trade-less]

[if accept]
	We accept your offer. Would you like to trade further under the same conditions?
	
	[anwer default] No only this time []
	[answer action:establish-trade-route] Yes, please come back, we will take us much as you can bring (establish **trade route**) []
[else:]
	You ask too much for too little. We can give you [good: counter] for your [good: less]
	[answer default] No thank you. []
	[answer action:buy] Okay, that is good enough. []
	[answer action:establish-trade-route] Okay, please come back and give us more (establish **trade route**) []

[dialog]
[name: native-trade-different-good]
....

```
