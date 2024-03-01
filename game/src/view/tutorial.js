import * as PIXI from 'pixi.js'

import Messages from 'data/tutorial'

import Util from 'util/util'
import Record from 'util/record'
import Events from 'util/events'
import Message from 'util/message'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import Europe from 'entity/europe'

import Click from 'input/click'
import Drag from 'input/drag'

import Foreground from 'render/foreground'
import Resources from 'render/resources'
import RenderView from 'render/view'
import Text from 'render/text'

import Dialog from 'view/ui/dialog'
import Icon from 'view/ui/icon'

const messageFunctions = {
  select: {
    subscribe: () =>
      Events.listen('select', () => {
        markDone('select')
      }),
  },
  move: {
    subscribe: () =>
      Record.getAll('unit').map(unit =>
        Unit.listen.tile(unit, tile => {
          if (!tile) {
            markDone('move')
          }
        })
      ),
  },
  drag: {
    subscribe: () =>
      Events.listen('drag', () => {
        markDone('drag')
      }),
  },
  zoom: {
    subscribe: () =>
      Events.listen('zoom', () => {
        markDone('zoom')
      }),
  },
  discovery: {
    subscribe: () =>
      Events.listen('discovery', () => {
        markDone('discovery')
      }),
  },
  landfall: {
    subscribe: () =>
      Events.listen('disembark', () => {
        markDone('landfall')
      }),
  },
  foundColony: {
    subscribe: () =>
      Events.listen('found', () => {
        markDone('foundColony')
      }),
  },
  goEurope: {
    extraCondition: () => {
      let result = false
      const unsubscribe = Europe.listen.units(units => {
        result = units.some(unit => unit.domain === 'land')
      })
      unsubscribe()
      return result
    },
    subscribe: () =>
      Europe.listen.units(units => {
        if (units.some(unit => unit.domain === 'sea')) {
          markDone('goEurope')
        }
      }),
  },
  inEurope: {
    subscribe: () =>
      Europe.listen.units(units => {
        if (isDone('goEurope') && !units.some(unit => unit.domain === 'sea')) {
          markDone('inEurope')
        }
      }),
  },
  colony: {
    open: () => {
      markDone('colony')
    },
  },
  equip: {
    open: () => {
      markDone('equip')
    },
  },
  pioneer: {
    extraCondition: () => Record.getAll('unit').some(unit => unit.properties.canTerraform),
    subscribe: () =>
      Events.listen('terraform', () => {
        markDone('pioneer')
      }),
  },
}

const prepareMessage = message => {
  message.valid = true
  message.shown = false
  message.doNotShowAgain = false
  const funcs = messageFunctions[message.name]
  if (funcs) {
    Object.keys(funcs).forEach(key => {
      message[key] = funcs[key]
    })
  } else {
    Message.tutorial.warn('no listeners attached to tutorial message', message.name, message)
  }

  return message
}

const originalDimensions = sprite => ({
  x: sprite.texture.baseTexture.realWidth,
  y: sprite.texture.baseTexture.realHeight,
})
const height = sprite =>
  (sprite.width * originalDimensions(sprite).y) / originalDimensions(sprite).x

const videoDialog = message => {
  const video = message.video
  const text = message.text

  const closePlane = new PIXI.Container()
  const frameView = Resources.sprite('tutorialFrame')

  const videoControls = video ? video.texture.baseTexture.source : null
  videoControls.loop = true
  videoControls.currentTime = 0
  videoControls.play()

  const textView = Text.create(text, {
    align: 'left',
  })

  const checkMark = Icon.create('check')
  checkMark.buttonMode = true

  const unsubscribeDimensions = RenderView.listen.dimensions(dimensions => {
    closePlane.hitArea = new PIXI.Rectangle(0, 0, dimensions.x, dimensions.y)

    frameView.width = 0.55 * dimensions.x
    frameView.height = height(frameView)
    frameView.x = (dimensions.x - frameView.width) / 2
    frameView.y = (dimensions.y - frameView.height) / 2

    video.width = 0.52 * dimensions.x
    video.height = height(video)
    video.x = frameView.x + 0.015 * dimensions.x
    video.y = frameView.y + 0.015 * dimensions.y

    textView.style = {
      ...textView.style,
      wordWrap: true,
      fontSize: Math.round(0.0175 * dimensions.x),
      wordWrapWidth: 0.48 * dimensions.x,
    }
    textView.x = (dimensions.x - textView.width) / 2
    textView.y = video.y + video.height + 0.03 * dimensions.y

    checkMark.scale.set((1.5 * Math.round(0.0175 * dimensions.x)) / 64)
    checkMark.x = frameView.x + frameView.width - 0.03 * dimensions.x - checkMark.width
    checkMark.y = frameView.y + frameView.height - 0.03 * dimensions.y - checkMark.height
  })

  Drag.waitForDrag().then(() => {
    Foreground.add.dialog(closePlane)
    Foreground.add.dialog(video)
    Foreground.add.dialog(frameView)
    Foreground.add.dialog(textView)
    Foreground.add.dialog(checkMark)

    Time.pause()
  })

  const close = () => {
    unsubscribeDimensions()
    videoControls.pause()

    Foreground.remove.dialog(closePlane)
    Foreground.remove.dialog(video)
    Foreground.remove.dialog(frameView)
    Foreground.remove.dialog(textView)
    Foreground.remove.dialog(checkMark)

    Time.resume()
  }

  Click.on(closePlane, close)
  Click.on(checkMark, () => {
    message.doNotShowAgain = true
    message.valid = false
    close()
  })
}

const show = message => {
  message.shown = true
  if (message.open) {
    message.open()
  }

  if (message.type === 'video') {
    videoDialog(message)
  } else {
    // Dialog.create({
    //   text: message.text,
    //   type: message.type,
    //   pause: true,
    // })
  }
}

const prepareVideo = message => {
  if (message.type === 'video') {
    message.video = Resources.video(message.name)
  }
}

const isDone = name => Record.getGlobal('tutorial')[name]
const markDone = name => {
  Record.getGlobal('tutorial')[name] = true
  const message = messages.find(msg => msg.name === name)
  Util.execute(message.unsubscribe)
  message.valid = false
}

const nextMessageTime = (currentTime, msg) =>
  currentTime + 1000 * (msg.wait ? (msg.shown ? msg.wait.repeat : msg.wait.initial) : 0)
const nextMessage = () => {
  const message = messages
    .filter(msg => !isDone(msg.name))
    .filter(msg => !msg.doNotShowAgain)
    .filter(msg => !msg.extraCondition || msg.extraCondition(msg))
    .find(msg => msg.preconditions.every(pre => isDone(pre)))

  if (message) {
    message.valid = true
    prepareVideo(message)
  }

  return message
}

let messages = []
const initialize = () => {
  if (!Record.getGlobal('tutorial')) {
    Record.setGlobal('tutorial', {})
  }

  messages = Messages.map(prepareMessage)
  messages
    .filter(msg => msg.subscribe)
    .forEach(msg => {
      msg.unsubscribe = msg.subscribe()
    })

  let message = nextMessage()
  let eta = 0
  Time.schedule({
    update: currentTime => {
      if (!message) {
        message = nextMessage()
        eta = 0
      }

      if (message && !message.valid) {
        message = nextMessage()
        eta = 0
      }

      if (message && !eta) {
        eta = nextMessageTime(currentTime, message)
      }

      if (message && currentTime >= eta) {
        show(message)
        eta = nextMessageTime(currentTime, message)
      }

      return true
    },
  })
}

export default { initialize }
