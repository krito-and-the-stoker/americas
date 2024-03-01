import * as PIXI from 'pixi.js'

import Click from 'input/click'
import Resources from 'render/resources'
import Text from 'render/text'

const padding = 7
const width = 250

const create = (text, fn) => {
  const container = new PIXI.Container()
  const button = Text.create(text)
  button.x = (width - button.width) / 2
  button.y = padding
  const background = Resources.sprite('status')
  background.width = width
  background.height = button.height + 2 * padding
  background.buttonMode = true
  Click.on(background, fn)

  container.addChild(background)
  container.addChild(button)

  return container
}

export default { create }
