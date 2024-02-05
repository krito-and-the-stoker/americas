import Util from 'util/util'

import Input from 'input'
import Hints from 'input/hints'
import Drag from 'input/drag'

const on = (target, fn, helpText) => {
  const handleDown = () => {
    Input.makeHot(target)
  }

  const handleUp = async e => {
    if (Input.isHot(target)) {
      e.stopPropagation()
      Input.clear()

      await Util.execute(fn, e.data.global)
    }
  }

  if (fn && !Drag.isDraggable(target)) {
    target.cursor = 'pointer'
  }

  const hint = {
    action: 'click',
    text: helpText,
  }

  const addHint = () => {
    if (helpText) {
      Hints.add(hint)
    }
  }
  const removeHint = () => {
    if (helpText) {
      Hints.remove(hint)
    }
  }

  target.eventMode = 'static'
  target
    .on('mousedown', handleDown)
    .on('mouseup', handleUp)
    .on('mouseover', addHint)
    .on('mouseout', removeHint)

  const unsubscribe = () => {
    removeHint()
    target
      .off('mousedown', handleDown)
      .off('mouseup', handleUp)
      .off('mouseover', addHint)
      .off('mouseout', removeHint)
  }

  return unsubscribe
}

export default {
  on,
}
