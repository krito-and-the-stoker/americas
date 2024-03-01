import Util from 'util/util'
import Record from 'util/record'

import Tile from 'entity/tile'
import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Storage from 'entity/storage'

import Dom from 'render/dom'

import UnitView from 'view/unit'
import UnitMapView from 'view/map/unit'
import GoodsView from 'view/goods'

let el
let destroy
let isNowOpen = false

const place = unit => {
  if (Europe.has.unit(unit)) {
    return 'London'
  }

  const tile = Tile.closest(unit.mapCoordinates)
  if (tile) {
    return Tile.description(tile, unit.owner)
  }

  return 'Americas'
}

const goods = unit =>
  Storage.goods(unit.storage)
    .filter(pack => pack.amount > 0)
    .map(pack => GoodsView.html(pack.good, CARGO_SCALE))
const passengers = unit =>
  unit.passengers.map(passenger => UnitView.html(passenger, PASSENGER_SCALE))

const select = unit => {
  close()
  UnitMapView.select(unit)
}

const CARGO_SCALE = 0.5
const PASSENGER_SCALE = 0.7
const render = () => {
  const { h, patch } = Dom
  el = el || document.querySelector('.screen')

  if (isNowOpen) {
    const units = Record.getAll('unit')
      .filter(unit => unit.owner.visible)
      // exclude colonists (they technically are still attached to a unit)
      .filter(unit => !(unit.colonist && unit.colonist.colony))
      // exclude passengers
      .filter(unit => !unit.vehicle)
      .map(unit =>
        h('div.unit', [
          UnitView.html(unit, 1, {
            on: {
              click: () => select(unit),
            },
          }),
          h('div.text', [
            h('div.name', Unit.name(unit)),
            h('div.command', unit.command && unit.command.display),
            h('div.place', place(unit)),
          ]),
          h('div.cargo', [h('div.passengers', passengers(unit)), h('div.goods', goods(unit))]),
        ])
      )

    el = patch(
      el,
      h('div.screen.units', [
        h('div.topbar', [
          h('div.heading', 'Unit Overview'),
          h('div.close', { on: { click: close } }, 'Close'),
        ]),
        h('div.list', units),
      ])
    )
  } else {
    el = patch(el, h('div.screen'))
  }
}

const create = () => {
  return Record.listen('unit', unit => {
    if (unit.owner.visible && !(unit.colonist && unit.colonist.colony)) {
      return [Unit.listen.tile(unit, render), render]
    }
  })
}

const open = () => {
  if (!isNowOpen) {
    isNowOpen = true
    destroy = create()
  }
}

const close = () => {
  if (isNowOpen) {
    isNowOpen = false
    Util.execute(destroy)
    destroy = null
  }
}

const isOpen = () => isNowOpen

export default {
  open,
  close,
  isOpen,
}
