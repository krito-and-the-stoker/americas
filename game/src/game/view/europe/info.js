import * as PIXI from 'pixi.js'

import Drag from 'input/drag'

import Unit from 'entity/unit'
import Market from 'entity/market'

import Text from 'render/text'

const create = () => {
  const container = new PIXI.Container()
  const text = Text.create()
  text.x = 20
  text.y = 0

  const unsubscribeDrag = Drag.listen(params => {
    if (params) {
      if (params.unit) {
        text.text = Unit.name(params.unit)
      }
      if (params.colonist) {
        text.text = Unit.name(params.colonist.unit)
      }
      if (params.good) {
        if (params.buyFromEurope) {
          const price = params.amount * Market.ask(params.good)
          text.text = `Buy ${params.amount} ${params.good} for ${price}`
        } else {
          const price = params.amount * Market.bid(params.good)
          text.text = `Sell ${params.amount} ${params.good} for ${price}`
        }
      }
      container.addChild(text)
    }

    return () => {
      container.removeChild(text)
    }
  })

  const unsubscribe = () => {
    unsubscribeDrag()
  }

  return {
    container,
    unsubscribe,
  }
}

export default { create }
