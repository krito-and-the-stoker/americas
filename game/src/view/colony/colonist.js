import * as PIXI from 'pixi.js'

import Colonists from 'data/colonists'
import Units from 'data/units'
import Goods from 'data/goods'

import Binding from 'util/binding'
import Util from 'util/util'

import Time from 'timeline/time'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'
import Colony from 'entity/colony'
import Production from 'entity/production'
import Tile from 'entity/tile'

import Dom from 'render/dom'
import Resources from 'render/resources'

import UnitView from 'view/unit'
import GoodsView from 'view/goods'

const frames = Units.settler.frame

const create = colonist => {
  const frame = colonist.unit.expert
    ? frames[colonist.unit.expert] || frames.default
    : frames.default
  const sprite = Resources.sprite('map', { frame })
  sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)

  return sprite
}

const createDetailView = colonist => {
  return null
}

const tint = colonist => {
  if (colonist.state.noFood) {    
    return 0xff6666
  }
  if (colonist.state.noWood) {
    return 0xff8888
  }

  if(colonist.state.noLuxury) {
    return 0xffcc66
  }

  if (colonist.state.isPromoting) {
    return 0xbbff99
  }

  if(colonist.state.hasBonus) {
    return 0x99bbff
  }

  return 0xffffff
}

export default { create, tint, createDetailView }
