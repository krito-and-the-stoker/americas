import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Binding from 'util/binding'
import Tween from 'util/tween'

import Input from 'input'
import Hints from 'input/hints'

import Foreground from 'render/foreground'

const DRAG_DISTANCE = 3

let draggables = []
const isDraggable = target => draggables.includes(target)

const defaultOptions = {
  highlight: true,
}

const on = (target, onStart = null, onMove = null, onEnd = null, paramOptions = {}) => {
  draggables.push(target)

  let initialCoords = null
  let inProgress = false

  const handleDown = e => {
    e.stopPropagation()
    Input.makeHot(target)
    initialCoords = {
      x: e.data.global.x,
      y: e.data.global.y,
    }
  }

  const handleMove = e => {
    if (!inProgress && Input.isHot(target)) {
      e.stopPropagation()
      let coords = {
        x: e.data.global.x,
        y: e.data.global.y,
      }
      if (Util.distance(initialCoords, coords) >= DRAG_DISTANCE) {
        Input.clear()
        Util.execute(onStart, initialCoords)
        inProgress = true
      }
    }

    if (inProgress) {
      e.stopPropagation()
      Util.execute(onMove, {
        x: e.data.global.x,
        y: e.data.global.y,
      })
    }
  }

  const handleEnd = e => {
    if (inProgress) {
      e.stopPropagation()
      inProgress = false
      Util.execute(onEnd, {
        x: e.data.global.x,
        y: e.data.global.y,
      })
    }
  }

  const options = Object.assign({}, defaultOptions, paramOptions)

  if (options.highlight) {
    target.cursor = 'grab'
  }

  let addHint = () => {}
  let removeHint = () => {}
  if (options.helpText) {
    const hint = {
      action: 'drag',
      text: options.helpText,
    }

    addHint = () => {
      Hints.add(hint)
    }
    removeHint = () => {
      Hints.remove(hint)
    }
  }

  target.eventMode = 'static'
  target
    .on('mousedown', handleDown)
    .on('globalmousemove', handleMove)
    .on('mouseup', handleEnd)
    .on('mouseupoutside', handleEnd)
    .on('mouseover', addHint)
    .on('mouseout', removeHint)

  const unsubscribe = () => {
    draggables = draggables.filter(t => t !== target)
    removeHint()
    target
      .off('mousedown', handleDown)
      .off('globalmousemove', handleMove)
      .off('mouseup', handleEnd)
      .off('mouseupoutside', handleEnd)
      .off('mouseover', addHint)
      .off('mouseout', removeHint)
  }

  return unsubscribe
}

const drags = {
  current: null,
}
const listen = fn => Binding.listen(drags, 'current', fn)
const update = value => Binding.update(drags, 'current', value)

const waitForDrag = () =>
  new Promise(resolve => {
    if (!drags.current) {
      resolve()
    } else {
      const unsubscribe = listen(currentDrag => {
        if (!currentDrag) {
          Util.execute(unsubscribe)
          resolve()
        }
      })
    }
  })

let dragTargetsInteractivity = []
const activateDragTargets = () => {
  // mark all possible drag targets interactive
  dragTargetsInteractivity = validDragTargets.map(({ sprite }) => {
    const original = sprite.eventMode || 'passive'
    sprite.eventMode = 'static'
    return {
      original,
      sprite,
    }
  })
}

const restoreDragTargets = () => {
  // restore their interactivity
  dragTargetsInteractivity.forEach(({ sprite, original }) => (sprite.eventMode = original))
  dragTargetsInteractivity = []
}

const findDragTargets = (coords, excludeSprite) => {
  activateDragTargets()

  // recursively find target by hit testing through the tree
  let targetSprite = null
  const findTarget = next => {
    if (next) {
      if (
        next !== excludeSprite &&
        validDragTargets.map(({ sprite }) => sprite).includes(next)
      ) {
        // found
        targetSprite = next
      } else {
        // temporarily disable interactivity to look further into the tree
        let originalEventMode = next.eventMode || 'passive'
        next.eventMode = false
        findTarget(Foreground.hitTest(coords))
        next.eventMode = originalEventMode
      }
    }
  }
  findTarget(excludeSprite)

  restoreDragTargets()
  return targetSprite
}

let dragTargets = []
let validDragTargets = []
const makeDraggable = (sprite, entity, helpText) => {
  let initialCoords = null
  let initialSpriteCoords = null
  let clone = new PIXI.Sprite(sprite.texture)

  const start = coords => {
    update(entity)
    validDragTargets = dragTargets
      .map(target => ({
        hint: target.isValid(entity),
        sprite: target.getSprite(),
        sprites: target.getSprites(),
        fn: target.fn,
      }))
      .filter(target => !!target.hint)
    const screenForeground = Foreground.dimScreen(
      Util.flatten(validDragTargets.map(target => target.sprites))
    )

    sprite.alpha = 0
    clone = new PIXI.Sprite(sprite.texture)
    clone.position = sprite.getGlobalPosition()
    const cloneScale = Util.globalScale(sprite)
    clone.scale.x = cloneScale
    clone.scale.y = cloneScale
    screenForeground.addChild(clone)

    initialSpriteCoords = {
      x: clone.x,
      y: clone.y,
    }
    initialCoords = {
      x: clone.x - coords.x,
      y: clone.y - coords.y,
    }
  }

  let releaseHint = null
  const move = coords => {
    clone.x = initialCoords.x + coords.x
    clone.y = initialCoords.y + coords.y

    const targetSprite = findDragTargets(coords, sprite)
    if (targetSprite) {
      releaseHint = Hints.add({
        action: 'release',
        text: validDragTargets.find(target => target.sprite === targetSprite).hint,
      })
    } else {
      Util.execute(releaseHint)
    }
  }

  const end = async coords => {
    const targetSprite = findDragTargets(coords, sprite)

    let result = false
    if (targetSprite) {
      result = await validDragTargets
        .find(target => targetSprite === target.sprite)
        .fn(entity, sprite.getGlobalPosition())
    }

    if (!result) {
      // TODO: doesn't work, because clone is in foreground which is being cleared on undim
      Tween.moveTo(clone, initialSpriteCoords, 100)
    }

    sprite.eventMode = 'static'
    sprite.alpha = 1
    update(null)
    validDragTargets = []
    Foreground.undimScreen()
    Util.execute(releaseHint)
  }

  return on(sprite, start, move, end, { helpText })
}

const makeDragTarget = (spriteArgument, isValid, fn) => {
  let getSprite = () => spriteArgument
  let getSprites = () => [spriteArgument]
  if (Util.isArray(spriteArgument)) {
    getSprite = () => spriteArgument[0]
    getSprites = () => spriteArgument
  }

  if (Util.isFunction(spriteArgument)) {
    getSprite = () => spriteArgument()[0]
    getSprites = spriteArgument
  }

  const target = {
    getSprite,
    getSprites,
    isValid,
    fn,
  }
  dragTargets.push(target)

  return () => (dragTargets = dragTargets.filter(t => t !== target))
}

export default {
  on,
  waitForDrag,
  makeDraggable,
  makeDragTarget,
  listen,
  isDraggable,
}
