import Keyboard from 'input/keyboard'

let hotTargets = []

const isHot = target => hotTargets.includes(target)
const makeHot = target => hotTargets.push(target)
const makeCold = target => (hotTargets = hotTargets.filter(t => t !== target))
const clear = () => (hotTargets = [])
const initialize = () => {
  Keyboard.initialize()

  window.addEventListener('mouseup', () => {
    requestAnimationFrame(clear)
  })
}

export default {
  isHot,
  makeHot,
  makeCold,
  initialize,
  clear,
}
