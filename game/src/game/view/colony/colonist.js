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

  let unsubscribe = null
  const close = () => {
    Util.execute(unsubscribe)
    detailView = patch(detailView, h('div.colonist-popup'))
  }

  const statusText = status =>
    ({
      bonus: 'Production Bonus',
      normal: 'Normal Production',
      promoting: 'Promoting',
      demoting: 'Demoting',
      malus: 'Production Malus',
    })[status]

  const render = () => {
    const renderPromotions = () => {
      const promotionData = Object.entries(colonist.promotion.promote || {})
        // only show possible promotion targets
        .filter(
          ([target]) =>
            (Colonists[colonist.unit.expert] || Colonists.default).consumption.promote[target]
        )
        // show largest progress first
        .sort(([, progressA], [, progressB]) => progressB - progressA)

      if (promotionData.length === 0) {
        return h('div.promoting')
      }

      const isPromotionTarget = target =>
        colonist.promotionStatus === 'promoting' &&
        ((colonist.unit.expert === 'criminal' && target === 'servant') ||
          (colonist.unit.expert === 'servant' && target === 'settler') ||
          Colonist.profession(colonist) === target)

      const etaDate = target => {
        const promotionTime =
          Time.get().currentTime +
          ((1.0 - colonist.promotion.promote[target]) * Time.PROMOTION_BASE_TIME) /
            colonist.promotion.speed
        const eta = Time.yearAndMonth(promotionTime)

        return `${eta.month} ${eta.year}`
      }

      return h('div.promoting', [
        h('h2', 'Promotions'),
        h(
          'div.targets',
          promotionData.map(([target, progress]) =>
            h('div.target', [
              h('span.progress', ` ${Math.round(100 * progress)}%`.slice(-3)),
              UnitView.html(colonist.unit, 0.75, {
                class: { icon: true },
              }),
              h('span.arrow', '→'),
              Dom.sprite(
                'map',
                Units.settler.frame[target] || Units.settler.frame.default,
                0.75,
                { class: { icon: true } }
              ),
              h(
                'span.name',
                {
                  class: {
                    active: isPromotionTarget(target),
                  },
                },
                Colonist.professionName(target)
              ),
              ...((isPromotionTarget(target) && [
                h('span.speed', `${colonist.promotion.speed}x`),
                h('span.eta', `done in ${etaDate(target)}`),
              ]) ||
                []),
            ])
          )
        ),
      ])
    }

    const renderDemotions = () => {
      const demotionData = Object.entries(colonist.promotion.demote || {}).sort(
        ([, progressA], [, progressB]) => progressB - progressA
      )

      if (demotionData.length === 0) {
        return h('div.demoting')
      }

      const demotionSpeed = () =>
        `${colonist.promotion.satisfactionLevel.demanded - colonist.promotion.satisfactionLevel.supplied}/${colonist.promotion.satisfactionLevel.demanded}`

      const etaDate = target => {
        const satLevel = colonist.promotion.satisfactionLevel
        const demotionSpeedFactor = (satLevel.demanded - satLevel.supplied) / satLevel.demanded

        const promotionTime =
          Time.get().currentTime +
          ((1.0 - colonist.promotion.demote[target]) * Time.DEMOTION_BASE_TIME) /
            demotionSpeedFactor
        const eta = Time.yearAndMonth(promotionTime)

        return `${eta.month} ${eta.year}`
      }

      return h('div.demoting', [
        h('h2', 'Demotions'),
        h(
          'div.targets',
          demotionData.map(([target, progress]) =>
            h('div.target', [
              h('span.progress', ` ${Math.round(100 * progress)}%`.slice(-3)),
              UnitView.html(colonist.unit, 0.75, {
                class: { icon: true },
              }),
              h('span.arrow', '→'),
              Dom.sprite(
                'map',
                Units.settler.frame[target] || Units.settler.frame.default,
                0.75,
                { class: { icon: true } }
              ),
              h(
                'span.name',
                {
                  class: {
                    active: colonist.promotionStatus === 'demoting',
                  },
                },
                Colonist.professionName(target)
              ),
              ...((colonist.promotionStatus === 'demoting' && [
                h('span.speed', `${demotionSpeed()}x`),
                h('span.eta', `done in ${etaDate(target)}`),
              ]) ||
                []),
            ])
          )
        ),
      ])
    }

    const renderResources = resourceData =>
      h(
        'div.resources',
        Util.flatten(
          Object.entries(resourceData)
            .filter(([good]) => Goods[good])
            .map(([good, amount]) =>
              Array(Math.abs(amount) || 1)
                .fill(0)
                .map(() =>
                  GoodsView.html(good, 0.5, {
                    class: {
                      negative: amount < 0,
                      inactive: amount === 0,
                      icon: true,
                    },
                  })
                )
            )
        )
      )

    const renderProduction = () => {
      const production = Colonist.production(colonist)
      let consumption = []
      if (colonist.work.type === 'Building') {
        if (production && production.good === 'bells') {
          consumption = Array(production.amount).fill('gold')
        } else if (production && production.good === 'construction') {
          const construction = Colony.currentConstruction(colonist.colony)
          consumption = Util.flatten(
            Object.entries(construction.cost).map(([good, amount]) =>
              Array(
                Math.ceil(
                  (production.amount * amount) / Util.sum(Object.values(construction.cost))
                )
              ).fill(good)
            )
          )
        } else {
          const { good, factor } = Production.consumption(colonist.work.building)
          consumption = good ? Array(production.amount * factor).fill(good) : []
        }
      }

      if (!production || !production.amount > 0) {
        return h('div.production')
      }

      return h('div.production-section', [
        h('h2', 'Production'),
        h('div.production', [
          h('div.amount', `${production.amount}`),
          h(
            'div.consume',
            consumption.map(good => GoodsView.html(good, 0.5, { class: { good: true } }))
          ),
          h('div.arrow', { class: { active: consumption.length > 0 } }, '→'),
          h(
            'div.produce',
            Array(production.amount)
              .fill(production.good)
              .map(good =>
                GoodsView.html(good, 0.5, {
                  class: { good: true },
                })
              )
          ),
        ]),
      ])
    }

    const renderConsumption = () => {
      return h('div.consumption', [
        h('h2', 'Consumption'),
        h('div.base.col', [
          h(
            'h2.category',
            {
              class: {
                active: colonist.promotion.satisfied.result,
              },
            },
            'Basic'
          ),
          renderResources(colonist.promotion.satisfied),
          h('div.reason', colonist.promotion.satisfied.reason),
        ]),
        h('div.bonus.col', [
          h('h2.category', { class: { active: colonist.promotion.bonus.result } }, 'Bonus'),
          renderResources(colonist.promotion.bonus),
          h('div.reason', colonist.promotion.bonus.reason),
        ]),
        h('div.promote.col', [
          h(
            'h2.category',
            {
              class: {
                active: colonist.promotion.promoting.result,
              },
            },
            'Promotion'
          ),
          renderResources(colonist.promotion.promoting),
          h('div.reason', colonist.promotion.promoting.reason),
        ]),
      ])
    }

    const view = h(
      'div.colonist-popup',
      h(
        'div.backdrop',
        { on: { click: close } },
        h('div.container', [
          UnitView.html(colonist.unit, 1.5, {
            class: { unit: true },
          }),
          h('h1', Unit.name(colonist.unit)),
          h(
            'div.status',
            h(
              'div.badge',
              { class: { [colonist.promotionStatus]: true } },
              statusText(colonist.promotionStatus)
            )
          ),

          h('div.power', [
            h('span.description', 'Power:'),
            h('span.amount', Math.round(Colonist.power(colonist) * 10)),
          ]),

          h('div.usage', [renderProduction(), renderConsumption()]),
          renderPromotions(),
          renderDemotions(),
        ])
      )
    )

    detailView = patch(detailView, view)
  }

  unsubscribe = Unit.listen.expert(colonist.unit, () =>
    Colonist.listen.promotionStatus(colonist, () =>
      Colonist.listen.promotion(
        colonist,
        Binding.map(
          promotion =>
            Object.values(promotion.promote || {})
              .map(value => Math.floor(100 * value))
              .join('-') +
            Object.values(promotion.demote || {})
              .map(value => Math.floor(100 * value))
              .join('-'),
          render
        )
      )
    )
  )

  return close
}

const tint = colonist => {
  if (colonist.promotionStatus === 'demoting' || colonist.promotionStatus === 'malus') {
    return 0xff6666
  }

  if (colonist.promotionStatus === 'promoting') {
    return 0xbbff99
  }

  if (colonist.promotionStatus === 'bonus') {
    return 0x99bbff
  }

  return 0xffffff
}

export default { create, tint, createDetailView }
