import * as PIXI from 'pixi.js'

import Storage from 'entity/storage'
import ProductionView from 'view/production'
import Binding from 'util/binding'

const create = colony => {
  const container = new PIXI.Container()

  const totalWidth = 550
  const rows = 3
  const height = 60

  container.position.y = 930 - height * rows
  container.position.x = 10
  const updateProductionSummary = summary => {
    const packs = Storage.productions(summary)
      .concat(Storage.goods(summary))
      .filter(({ amount }) => amount !== 0)
      .sort((a, b) => b.amount - a.amount)
    const cols = Math.ceil(packs.length / rows)
    const width = totalWidth / cols
    const views = packs.map(pack => ProductionView.create(pack.good, pack.amount, width))

    views.forEach((view, index) => {
      view.forEach(s => {
        s.x += (index % cols) * width
        s.y += Math.floor(index / cols) * height
        container.addChild(s)
      })
    })

    return () => {
      views.flat().forEach(s => container.removeChild(s))
    }
  }

  const unsubscribe = Storage.listen(
    colony.productionSummary,
    Binding.map(Storage.copy, updateProductionSummary, Storage.equals)
  )

  return {
    unsubscribe,
    container,
  }
}

export default { create }
