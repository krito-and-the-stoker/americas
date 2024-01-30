We currently have a very low level framework, that allows us to do html overlays. It uses a shadow DOM and is probably pretty efficient, but a bit painful to write. It would be nice to have the UI components in component files, so that they can be edited more easily. Also, we will need a small layer to make sure the reactivity system of the framework works well with the reactivity system of our game.

### Frameworks
- Solid: uses signals, probably very efficient, very promising
- Vue: uses dependencies and shadow DOM, efficient, promising
- Svelte: is similar to Vue, uses signals, but needs a compiler, not so promising
- React: Nope.
