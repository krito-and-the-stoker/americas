import Util from 'util/util'
import Binding from 'util/binding'

const state = {
  target: null,
  data: null,
}

const update = {
  target: value => Binding.update(state, 'target', value),
  data: value => Binding.update(state, 'data', value),
}

const listen = {
  target: fn => Binding.listen(state, 'target', fn),
  data: fn => Binding.listen(state, 'data', fn),
}

const track = (target, data) => {
  function addTarget() {
    if (state.target !== target) {      
      update.target(target)
      update.data(data)
    }
  }


  function removeTarget() {
    if (state.target === target) {
      update.target(null)
      update.data(null)
    }
  }


  target.eventMode = 'static'
  target
    .on('mouseover', addTarget)
    .on('mouseout', removeTarget)

  const unsubscribe = () => {
    removeTarget()
    target
      .off('mouseover', addTarget)
      .off('mouseout', removeTarget)
  }

  return unsubscribe
}

export default {
  track,
  listen
}
