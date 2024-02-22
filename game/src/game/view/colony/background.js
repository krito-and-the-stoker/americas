import * as PIXI from 'pixi.js'

import Resources from 'render/resources'
import Colony from 'entity/colony'
import Click from 'input/click'
import Drag from 'input/drag'
import UnjoinColony from 'interaction/unjoinColony'
import LoadUnitFromShipToColony from 'interaction/loadUnitFromShipToColony'

const create = colony => {
  const container = new PIXI.Container()
  // const background = Resources.sprite('colonyBackground')

  const background = new PIXI.Graphics();
  background.beginFill(0x43602a, 1); // light green
  // background.beginFill(0x41492a, 1); // the dark green
  // background.beginFill(0x838165, 1); // the grey of the buildings floor
  background.drawRect(0, 0, 1920, 1080); // Change these values as needed
  background.endFill();  

  container.addChild(background)

  const originalDimensions = {
    x: background.width,
    y: background.height,
  }

  // capture click on background so we dont close the screen
  const unsubscribeClick = Click.on(background)

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
    unsubscribe: [unsubscribeClick, unsubscribeDragTarget],
  }
}

export default {
  create,
}
