import Goods from 'data/goods.json'

import Util from 'util/util'
import Resources from 'render/resources'
import Text from 'render/text'

const MIN_DISTANCE = 4
const MAX_DISTANCE = 30

const create = (resource, amount, width = 100) => {
  if (amount !== 0) {
    let absoluteAmount = Math.abs(amount)
    const displayFactor = Goods[resource].displayFactor || 1
    let numberOfSprites = absoluteAmount / displayFactor
    let distance = Math.min(MAX_DISTANCE, width / numberOfSprites)
    if (distance < MIN_DISTANCE) {
      distance = MIN_DISTANCE
      numberOfSprites = Math.round(width / distance)
    }
    const result = Util.range(Math.max(0, Math.floor(numberOfSprites))).map(i => {
      const sprite = Resources.sprite('map', {
        frame: Goods[resource].id,
      })
      sprite.x = distance * numberOfSprites - Math.round((i + 1) * distance)
      sprite.y = 0
      if (amount < 0) {
        sprite.tint = 0xff6666
      }
      return sprite
    })
    if (absoluteAmount >= 6) {
      const number = Text.create(absoluteAmount, {
        fill: amount > 0 ? 0xffffff : 0xff6666,
      })
      number.x = width / 2
      number.y = 10
      result.push(number)
    }
    return result
  } else {
    return []
  }
}

export default { create }
