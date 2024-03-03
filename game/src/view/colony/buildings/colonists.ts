import * as PIXI from 'pixi.js'

import Goods from 'data/goods.json'

import Drag from 'input/drag'
import Click from 'input/click'
import Hover from 'input/hover'

import Building from 'entity/building'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import Production from 'entity/production'
import Unit from 'entity/unit'

import Resources from 'render/resources'
import ColonistView from 'view/colony/colonist'

import ProductionView from 'view/production'

import Triangles from 'view/colony/buildings/triangles'

import type { BuildingEntity  } from 'view/colony/buildings'


interface Colonist {
  unit: any
}

interface Work {
  building: any
  position: number
}



const createOne = (building: BuildingEntity, colonist: Colonist, work: Work, container: PIXI.Container) => {
  if (work && work.building === building) {
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
    if (production) {
      const productionSprites = ProductionView.create(
        production.good,
        Math.round(production.amount),
        Triangles.TILE_SIZE / 4
      )
      productionSprites.forEach(s => {
        s.position.x += position.x
        s.position.y += position.y + 3 * Triangles.TILE_SIZE / 4
        s.scale.set(0.66)
        container.addChild(s)
      })
      return [
        Colonist.listen.state(colonist, () => {
          colonistSprite.tint = ColonistView.tint(colonist)
        }),
        () => {
          productionSprites.forEach(s => container.removeChild(s))
          container.removeChild(colonistSprite)
        },
        Click.on(
          colonistSprite,
          () => ColonistView.createDetailView(colonist),
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


    return [
      () => {
        container.removeChild(colonistSprite)
      },
      Click.on(
        colonistSprite,
        () => ColonistView.createDetailView(colonist),
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
      unsubscribeEducation,
    ]
  }
}

const create = (building: BuildingEntity, container: PIXI.Container) => {
  const colony = building.colony
  const unsubscribeColonists = Colony.listen.productionBonus(colony, () =>
    Colony.listen.colonists(colony, (colonists: Colonist[]) =>
      colonists.map(colonist =>
        Colonist.listen.work(
          colonist,
          (work: Work) =>
            colonist?.unit &&
            Unit.listen.expert(colonist.unit, () =>
              Colonist.listen.state(colonist, () =>
                createOne(building, colonist, work, container)
              )
            )
        )
      )
    )
  )
  return unsubscribeColonists
}

export default {
  create
}