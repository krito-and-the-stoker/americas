import * as PIXI from 'pixi.js'

import Util from 'util/util'
import Binding from 'util/binding'

import Colony from 'entity/colony'
import Building from 'entity/building'
import Storage from 'entity/storage'
import Construction from 'entity/construction'

import Dialog from 'view/ui/dialog'
import Button from 'view/ui/button'
import ProductionView from 'view/production'
import Text from 'render/text'

const create = (colony, originalDimensions) => {
  const container = {
    panel: new PIXI.Container(),
    menu: new PIXI.Container(),
  }

  const buildingText = Text.create(Colony.currentConstruction(colony).name)
  buildingText.x = originalDimensions.x - 450 + 20
  buildingText.y = originalDimensions.y / 2 - 75
  container.panel.addChild(buildingText)

  const updateConstructionPanel = () => {
    const construction = Colony.currentConstruction(colony)
    const totalCost = Util.sum(Object.values(construction.cost))
    const percentage =
      totalCost > 0 ? Math.min(100, Math.floor((100 * construction.progress) / totalCost)) : 0
    buildingText.text = `${construction.name} (${percentage}%)`
  }

  const unsubscribe = [
    Colony.listen.construction(
      colony,
      Binding.map(
        construction => Math.round(Colony.currentConstruction(colony).progress),
        updateConstructionPanel
      )
    ),
    Colony.listen.constructionTarget(colony, updateConstructionPanel),
  ]

  return {
    container,
    unsubscribe,
  }
}

export default { create }
