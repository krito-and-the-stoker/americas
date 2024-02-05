import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Tween from 'util/tween'
import Message from 'util/message'

import Click from 'input/click'
import Drag from 'input/drag'

import Colony from 'entity/colony'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import EquipUnitFromShip from 'interaction/equipUnitFromShip'
import EquipUnitFromColony from 'interaction/equipUnitFromColony'

import UnitView from 'view/unit'
import UnitMapView from 'view/map/unit'
import MapView from 'view/map'
import Transport from 'view/transport'

const create = (colony, closeScreen, originalDimensions) => {
  const container = new PIXI.Container()

  const shipPositions = [
    {
      x: 0,
      y: 550,
      taken: false,
    },
    {
      x: 128,
      y: 550,
      taken: false,
    },
    {
      x: 256,
      y: 550,
      taken: false,
    },
    {
      x: 3 * 128,
      y: 550,
      taken: false,
    },
    {
      x: 512,
      y: 550,
      taken: false,
    },
  ]
  const unsubscribeShips = Colony.listenEach.units(colony, (unit, added) => {
    if (unit.domain === 'sea' || unit.properties.cargo > 0) {
      const view = Transport.create(unit)
      const unsubscribeClick = Click.on(
        view.sprite,
        () => {
          closeScreen()
          MapView.centerAt(view.unit.mapCoordinates, 0)
          UnitMapView.select(view.unit)
        },
        `Select ${Unit.name(unit)}`
      )
      const position = shipPositions.find(pos => !pos.taken)
      if (!position) {
        Message.warn('could not display unit, no position left', unit)
        return unsubscribeClick
      }

      position.taken = true
      view.container.x = position.x
      view.container.y = position.y
      container.addChild(view.container)

      if (added) {
        Tween.moveFrom(view.container, { x: -120, y: 500 }, 1500)
      }

      return () => {
        Util.execute(view.unsubscribe)
        unsubscribeClick()
        position.taken = false
        Tween.moveTo(view.container, { x: -120, y: 500 }, 1500).then(() => {
          container.removeChild(view.container)
        })
      }
    }
  })

  const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
  greyScaleFilter.blackAndWhite()

  const landPositions = Util.range(25).map(index => ({
    x: 0.9 * originalDimensions.x - index * 64,
    y: 0.9 * originalDimensions.y - 125 - 64,
    taken: false,
  }))

  const drawLandUnit = (unit, added) => {
    const position = landPositions.find(pos => !pos.taken)
    if (!position) {
      Message.warn('could not display unit, no position left', unit)
      return
    }
    position.taken = true

    const view = UnitView.create(unit)
    const sprite = view.sprite
    sprite.x = position.x
    sprite.y = position.y
    sprite.scale.set(2)
    container.addChild(sprite)

    if (added) {
      Tween.fadeIn(sprite, 350)
    }

    const unsubscribeDrag = Drag.makeDraggable(
      sprite,
      { unit },
      'Move into colony to start working or move onto ship'
    )

    const unsubscribeClick = Click.on(
      sprite,
      () => {
        closeScreen()
        MapView.centerAt(unit.mapCoordinates, 0)
        UnitMapView.select(unit)
      },
      `Select ${Unit.name(unit)}`
    )

    const unsubscribePioneering = Unit.computed.pioneering(unit, pioneering => {
      sprite.filters = pioneering ? [greyScaleFilter] : []
    })

    const unsubscribeDragTarget = Drag.makeDragTarget(
      sprite,
      args => {
        const { good, amount, colony } = args

        if (args.unit && amount && good) {
          return `Equip ${Unit.name(unit)} with ${amount} ${good} from ${Unit.name(args.unit)}`
        }

        if (colony) {
          return `Equip ${Unit.name(unit)} with ${amount} ${good} from ${colony.name}`
        }
      },
      args => {
        const { good, amount, colony } = args
        const fromUnit = args.unit
        if (fromUnit) {
          EquipUnitFromShip(fromUnit, unit, { good, amount })
        }
        if (colony) {
          EquipUnitFromColony(colony, unit, { good, amount })
        }

        return false
      }
    )

    return () => {
      position.taken = false
      container.removeChild(sprite)
      Util.execute([
        unsubscribeClick,
        unsubscribeDrag,
        unsubscribeDragTarget,
        unsubscribePioneering,
        view.unsubscribe,
      ])
    }
  }

  const unsubscribeLandUnits = Colony.listenEach.units(
    colony,
    (unit, added) =>
      unit.domain === 'land' &&
      !unit.properties.cargo &&
      Unit.listen.colonist(
        unit,
        colonist =>
          (!colonist && drawLandUnit(unit, added)) ||
          Colonist.listen.colony(colonist, colony => !colony && drawLandUnit(unit, added))
      )
  )

  const unsubscribe = [unsubscribeLandUnits, unsubscribeShips]

  return {
    container,
    unsubscribe,
  }
}

export default { create }
