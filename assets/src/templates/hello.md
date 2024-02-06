[dialog]
[name: hello_world]
_Hallo_ {counter} **Welt**!

[if counter]
We have a counter!
[button action:reset] Reset []
[]

[button action:increment] Increment []

[repeat list] {.}, []


[dialog]
[name: second_dialog]
Here is a second dialog in one file