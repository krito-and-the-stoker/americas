import * as PIXI from 'pixi.js'

import Unit from 'entity/unit'

import Resources from 'render/resources'
import Dom from 'render/dom'

const createTexture = unit => Resources.texture('map', { frame: getFrame(unit) })
const getFrame = unit =>
  unit.expert
    ? unit.properties.frame[unit.expert] || unit.properties.frame.default
    : unit.properties.frame.default

const create = unit => {
  const sprite = new PIXI.Sprite(createTexture(unit))

  if (unit.domain === 'land') {
    sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)
  }

  const unsubscribe = Unit.listen.properties(unit, () => {
    sprite.texture = createTexture(unit)
  })

  return {
    sprite,
    unsubscribe,
  }
}

const html = (unit, scale, options) => Dom.sprite('map', getFrame(unit), scale, options)

export default {
  getFrame,
  create,
  html,
}
