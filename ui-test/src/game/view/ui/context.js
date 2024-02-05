import * as PIXI from 'pixi.js'

import Foreground from 'render/foreground'
import Resources from 'render/resources'
import ProductionView from 'view/production'
import Click from 'input/click'

const productionOption = choice => {
  const container = new PIXI.Container()
  container.hitArea = new PIXI.Rectangle(0, 0, 100, 100)
  ProductionView.create(choice.good, choice.amount).forEach(s => container.addChild(s))

  return {
    container,
    choice,
  }
}

const cancelAll = () => {
  containers.forEach(c => {
    Foreground.get().context.removeChild(c.container)
    // c.reject()
  })
  containers = []
}

let containers = []
const create = (options, coords, radius = 100, scale = 1) =>
  new Promise((resolve, reject) => {
    cancelAll()
    const container = new PIXI.Container()
    const ring = Resources.sprite('ring')
    ring.width = 2.2 * radius
    ring.height = 2.2 * radius
    container.addChild(ring)

    options.forEach((option, index) => {
      const angle = Math.PI / 2 - (2 * Math.PI * index) / options.length
      option.container.x = (radius * Math.cos(angle)) / 1.2
      option.container.y = 40 - (radius * Math.sin(angle)) / 1.2
      Click.on(option.container, () => {
        Foreground.get().context.removeChild(container)
        resolve(option.choice)
      })
      container.addChild(option.container)
    })
    container.x = coords.x
    container.y = coords.y
    container.scale.set(scale)
    Foreground.get().context.addChild(container)
    containers.push({
      container,
      reject,
    })
  })

export default {
  productionOption,
  create,
  cancelAll,
}
