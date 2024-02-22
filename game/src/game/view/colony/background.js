import * as PIXI from 'pixi.js'

import Resources from 'render/resources'
import Colony from 'entity/colony'
import Click from 'input/click'
import Drag from 'input/drag'
import UnjoinColony from 'interaction/unjoinColony'
import LoadUnitFromShipToColony from 'interaction/loadUnitFromShipToColony'

const create = colony => {
  const container = new PIXI.Container()

  const originalDimensions = {
    x: 1920,
    y: 1080,
  }

  const leaveColonyZone = new PIXI.Container()
  leaveColonyZone.hitArea = new PIXI.Rectangle(
    0.3 * originalDimensions.x,
    0.65 * originalDimensions.y,
    0.45 * originalDimensions.x,
    0.25 * originalDimensions.y
  )
  container.addChild(leaveColonyZone)

  const unsubscribeDragTarget = Drag.makeDragTarget(
    leaveColonyZone,
    ({ colonist, passenger }) => {
      if (colonist && colonist.colony) {
        return 'Leave colony'
      }
      if (passenger) {
        return 'Unload passenger'
      }
    },
    ({ colonist, passenger }) => {
      if (colonist) {
        UnjoinColony(colonist)
      }
      if (passenger) {
        LoadUnitFromShipToColony(colony, passenger)
      }
    }
  )

  return {
    container,
    originalDimensions,
    unsubscribe: unsubscribeDragTarget,
  }
}

export default {
  create,
}
