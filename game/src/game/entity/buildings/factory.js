import Buildings from 'data/buildings.json'

import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Colony from 'entity/colony'


const positions = Util.range(11)
  .map(x =>
    Util.range(5).map(y => ({
      x,
      y,
      width: x >= 4 && x <= 6 ? 2 : 1,
      taken: false,
    }))
  )
  .flat()
  .filter(({ x, y }) => x >= 3 && x <= 8 && y >= 1 && y <= 3 && (x <= 7 || y >= 2))

const make = name => {
  const create = colony => {
    const building = {
      name,
      level: 1,
      colony,
      width: Buildings[name].width,
      position: Util.choose(positions),
    }

    initialize(building)

    return building
  }

  const initialize = building => {

  }

  return {
    create,
    initialize
  }
}

export default {
  make
}