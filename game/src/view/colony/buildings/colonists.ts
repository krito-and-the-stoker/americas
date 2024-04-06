import * as PIXI from 'pixi.js'
import $ from 'signal-chain'

import Goods from 'data/goods.json'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Colony from 'entity/colony'
import Storage from 'entity/storage'
import Building from 'entity/building'
import Colonist from 'entity/colonist'
import Production from 'entity/production'

import Resources from 'render/resources'
import ColonistView from 'view/colony/colonist'
import DetailView from 'view/detail'

import ProductionView from 'view/production'

import Triangles from 'view/colony/buildings/triangles'

import type { BuildingEntity  } from 'view/colony/buildings'
import { ColonistEntity, StorageEntity } from 'entity/colonist/types'


const createOne = (building: BuildingEntity, colonist: ColonistEntity, container: PIXI.Container) => {
  const work = colonist.work
  if (work && work.type === 'Building' && work.building === building) {
    const position = {
      x:
        (work.position * 92) /
        (Building.workspace(building.colony, work.building.name) || 1) + 64,
      y: 20 + 32,
    }
    const colonistSprite = ColonistView.create(colonist)
    colonistSprite.x = position.x
    colonistSprite.y = position.y
    colonistSprite.scale.set(1.25)
    container.addChild(colonistSprite)

    const unsubscribeEducation = Colonist.listen.beingEducated(colonist, (beingEducated: boolean) => {
      if (beingEducated) {
        const bookSprite = Resources.sprite('map', {
          frame: Goods.books.id,
        })
        bookSprite.scale.set(0.5)
        bookSprite.x = 0.5 * Triangles.TILE_SIZE
        bookSprite.y = 0
        colonistSprite.addChild(bookSprite)
        return () => {
          colonistSprite.removeChild(bookSprite)
        }
      }
    })

    const production = Production.production(building.colony, building, colonist)
    let unsubscribeProduction
    if (production && production.good) {
      const realProduction = $.primitive.connect(
        $.emit(colonist),
        $.select(colonist => colonist.productionSummary),
        Storage.signal,
        $.select<StorageEntity, number>(storage => storage[production.good] ?? production.amount),
        $.unique.select(amount => Math.round(amount)),
      )

      unsubscribeProduction = [
        $.connect(
          realProduction.listen,
          $.effect(amount => {
            const productionSprites = ProductionView.create(
              production.good,
              Math.round(amount),
              Triangles.TILE_SIZE / 4
            )
            productionSprites.forEach(s => {
              s.position.x += position.x
              s.position.y += position.y + 3 * Triangles.TILE_SIZE / 4
              s.scale.set(0.66)
              container.addChild(s)
            })

            return () => {
              productionSprites.forEach(s => container.removeChild(s))
            }
          })
        ),
        realProduction.disconnect,
      ]
    }

    const unsubscribeTint = Colonist.listen.state(colonist, () => {
      colonistSprite.tint = ColonistView.tint(colonist)
    })

    console.log('draw colonist', colonist.referenceId)
    return [
      () => {
        console.log('removed colonist', colonist.referenceId)
        container.removeChild(colonistSprite)
      },
      unsubscribeProduction,
      unsubscribeTint,
      unsubscribeEducation,
      Click.on(
        colonistSprite,
        () => DetailView.Colonist.open(colonist),
        'View details'
      ),
      Hover.track(
        colonistSprite,
        { type: 'colonist', colonist }
      ),
      Drag.makeDraggable(
        colonistSprite,
        { colonist },
        'Move to field or other building to change production'
      ),
    ]
  }
}

const create = (building: BuildingEntity, container: PIXI.Container) => {
  const colony = building.colony
  const unsubscribeColonists = Colony.listenEach.colonists(
    colony, (colonist: ColonistEntity) => $.connect(
      $.emit(colonist),
      $.combine(
        Colonist.chain.expert,
        $.listen.key('work')
      ),
      $.select(([_, work]) => work),
      $.effect(work => {
        if (work?.type === 'Building' && work?.building === building) {
          return createOne(building, colonist, container)
        }
      })
    )
  )

  return unsubscribeColonists
}

export default {
  create
}