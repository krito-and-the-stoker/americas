import * as PIXI from 'pixi.js'

import Units from 'data/units'
import Goods from 'data/goods'

import Unit from 'entity/unit'
import Colonist from 'entity/colonist'

import Dom from 'render/dom'
import Resources from 'render/resources'

import UnitView from 'view/unit'
import GoodsView from 'view/goods'


const frames = Units.settler.frame

const create = colonist => {
	const frame = colonist.expert ? frames[colonist.expert] || frames.default : frames.default
	const sprite = Resources.sprite('map', { frame })
	sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)

	return sprite
}


let detailView = null
const createBaseElement = () => {
  if (!detailView) {
    detailView = document.createElement('div')
    detailView.classList.add('colonist-popup')
    document.body.appendChild(detailView)
  }

  return detailView
}

const createDetailView = colonist => {
  const { h, patch } = Dom
  createBaseElement()

  const close = () => {
    detailView = patch(detailView, h('div.colonist-popup'))
  }

  const statusText = status => ({
    'bonus': 'Production Bonus',
    'normal': 'Normal Production',
    'promoting': 'Promoting',
    'demoting': 'Demoting'
  }[status])

  const render = () => {
    const view = h('div.colonist-popup',
      h('div.backdrop', { on: { click: close } },
        h('div.container', [
          UnitView.html(colonist.unit, 1.5, { class: { unit: true } }),
          h('h1', Unit.name(colonist.unit)),
          h('div.status',
            h('div.badge', { class: { [colonist.promotionStatus]: true } }, statusText(colonist.promotionStatus))),
          h('div.usage', [
            h('h2', 'Production'),
            h('div.production', 'Not implemented yet'),
            h('h2', 'Consumption'),
            h('div.base.col', [
              h('h2.category', { class: { active: colonist.promotion.satisfied.result } }, 'Basic'),
              h('div.resources',
                Object.entries(colonist.promotion.satisfied)
                  .filter(([good]) => Goods[good])
                  .map(([good, amount]) => GoodsView.html(good, 0.5, {
                    class: {
                      negative: amount < 0,
                      icon: true
                    }
                  }))),
              h('div.reason', colonist.promotion.satisfied.reason)
            ]),
            h('div.bonus.col', [
              h('h2.category', { class: { active: colonist.promotion.bonus.result } }, 'Bonus'),
              h('div.resources', Object.entries(colonist.promotion.bonus)
                .filter(([good]) => Goods[good])
                .map(([good, amount]) => GoodsView.html(good, 0.5, {
                  class: {
                    negative: amount < 0,
                    icon: true
                  }
                }))),
              h('div.reason', colonist.promotion.bonus.reason)
            ]),
            h('div.promote.col', [
              h('h2.category', { class: { active: colonist.promotion.promoting.result } }, 'Promotion'),
              h('div.resources', Object.entries(colonist.promotion.promoting)
                .filter(([good]) => Goods[good])
                .map(([good, amount]) => GoodsView.html(good, 0.5, {
                  class: {
                    negative: amount < 0,
                    icon: true
                  }
                }))),
              h('div.reason', colonist.promotion.promoting.reason)
            ])
          ]),
          h('div.promoting', [
            h('h2', 'Promotions'),
            h('div.targets', Object.entries(colonist.promotion.promote || {})
              .map(([target, progress]) => h('div.target', [
                h('span.progress', ` ${Math.round(100 * progress)}%`.slice(-3)),
                UnitView.html(colonist.unit, 0.75, { class: { icon: true } }),
                h('span.arrow', '→'),
                Dom.sprite('map', Units.settler.frame[target] || Units.settler.frame.default, 0.75, { class: { icon: true } }),
                h('span.name', { class: { active: colonist.promotionStatus === 'promoting' && Colonist.profession(colonist) === target } }, Colonist.professionName(target))
              ])))
          ]),
          h('div.demoting', [
            h('h2', 'Demotions'),
            h('div.targets', Object.entries(colonist.promotion.demote || {})
              .map(([target, progress]) => h('div.target', [
                h('span.progress', ` ${Math.round(100 * progress)}%`.slice(-3)),
                UnitView.html(colonist.unit, 0.75, { class: { icon: true } }),
                h('span.arrow', '→'),
                Dom.sprite('map', Units.settler.frame[target] || Units.settler.frame.default, 0.75, { class: { icon: true } }),
                h('span.name', { class: { active: colonist.promotionStatus === 'demoting' } }, Colonist.professionName(target))
              ])))
          ])
        ])))

    detailView = patch(detailView, view)
  }

  render()

  return close
}

const tint = colonist => {
  if (colonist.promotionStatus === 'demoting') {
    return 0xFF6666
  }

  if (colonist.promotionStatus === 'promoting') {
    return 0x66FF66
  }

  if (colonist.promotionStatus === 'bonus') {
    return 0x6666FF
  }

  return 0xFFFFFF
}



export default { create, tint, createDetailView }