import * as PIXI from 'pixi.js'

import Europe from 'entity/europe'

import Click from 'input/click'

import Resources from 'render/resources'
import RenderView from 'render/view'
import Foreground from 'render/foreground'
import Text from 'render/text'

import Button from 'view/ui/button'
import Dialog from 'view/ui/dialog'

import UnitsView from 'view/europe/units'
import MarketView from 'view/europe/market'
import InfoView from 'view/europe/info'

const open = () => {
  const screen = create()
  Foreground.openScreen(screen, { name: 'europe' })
}

const close = () => {
  Foreground.closeScreen()
}

const create = () => {
  const container = new PIXI.Container()
  const normalContainer = new PIXI.Container()
  const backgroundContainer = new PIXI.Container()
  container.addChild(backgroundContainer)
  container.addChild(normalContainer)

  const background = Resources.sprite('europeBackground')
  const originalDimensions = {
    x: background.width,
    y: background.height,
  }
  Click.on(background)
  backgroundContainer.addChild(background)

  const market = MarketView.create(originalDimensions)
  backgroundContainer.addChild(market.container.goods)
  backgroundContainer.addChild(market.container.pricing)

  const units = UnitsView.create(close, originalDimensions)
  normalContainer.addChild(units.container.ships)
  normalContainer.addChild(units.container.units)
  normalContainer.addChild(units.container.dialog)

  const info = InfoView.create(originalDimensions)
  normalContainer.addChild(info.container)

  const nameHeadline = Text.create('London', {
    fontSize: 50,
  })
  nameHeadline.anchor.set(0.5)
  nameHeadline.position.x = originalDimensions.x / 2
  nameHeadline.position.y = 80
  normalContainer.addChild(nameHeadline)

  // const recruitButton = Button.create('recruit', () => Dialog.create({
  // 	type: 'menu',
  // 	text: 'Who would you like to recruit?',
  // 	options: Europe.recruitmentOptions()
  // }))
  // recruitButton.x = originalDimensions.x - recruitButton.width - 20
  // recruitButton.y = originalDimensions.y / 2
  // normalContainer.addChild(recruitButton)

  const purchaseButton = Button.create('purchase', () =>
    Dialog.open('europe.purchase', {
      options: Europe.purchaseOptions()
    })
  )
  purchaseButton.x = originalDimensions.x - purchaseButton.width - 20
  purchaseButton.y = originalDimensions.y / 2 + 60
  normalContainer.addChild(purchaseButton)

  const trainButton = Button.create('train', () =>
    Dialog.open('europe.train', {
      options: Europe.trainOptions(),
    })
  )
  trainButton.x = originalDimensions.x - trainButton.width - 20
  trainButton.y = originalDimensions.y / 2 + 120
  normalContainer.addChild(trainButton)

  RenderView.updateWhenResized(({ dimensions }) => {
    const scale = {
      x: dimensions.x / originalDimensions.x,
      y: dimensions.y / originalDimensions.y,
    }
    const coverScale = Math.max(scale.x, scale.y)

    backgroundContainer.scale.set(coverScale)
    background.x = dimensions.x / coverScale - background.width
    background.y = dimensions.y / coverScale - background.height - (123 * scale.x) / coverScale
    market.container.goods.y = dimensions.y / coverScale
    market.container.goods.scale.set(scale.x / coverScale)
    market.container.pricing.y = 200
    info.container.y = dimensions.y / coverScale - (123 * scale.x) / coverScale - 50

    normalContainer.scale.set(coverScale)
    units.container.units.x = Math.max(dimensions.x / coverScale - 0.4 * background.width, 64)
    units.container.units.y = dimensions.y / coverScale - (123 * scale.x + 148) / coverScale
    units.container.ships.x = Math.max(dimensions.x / coverScale - 0.6 * background.width, 64)
    units.container.ships.y =
      dimensions.y / coverScale - (123 * scale.x + 148 + 32 + 64) / coverScale

    nameHeadline.x = dimensions.x / (2 * coverScale)
    // recruitButton.x = dimensions.x / coverScale - recruitButton.width - 20
    purchaseButton.x = dimensions.x / coverScale - purchaseButton.width - 20
    trainButton.x = dimensions.x / coverScale - trainButton.width - 20
  })

  const unsubscribe = [units.unsubscribe, market.unsubscribe, info.unsubscribe]

  return {
    container,
    unsubscribe,
  }
}

export default {
  open,
  close,
}
