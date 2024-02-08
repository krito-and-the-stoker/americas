import Record from 'util/record'
import Events from 'util/events'

import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'
import Europe from 'entity/europe'

// TODO: implement these
// After choice
// - These are the burial grounds of our ancient fathers! You have trespassed on sacred land. Now you must die!
// - The mounds are cold and empty.
// - Within, you find trinkets worth [x gold].
// - Within, you find incredible treasure worth [x gold]! It will take a Galleon to get this treasure back to Europe!

const options = [
  {
    name: 'rumor.empty',
    action: () => {},
    probability: 1,
  },
  {
    name: 'expedition.vanished',
    action: ({ unit }) => Unit.disband(unit),
    probability: 0.1,
  },
  {
    name: 'expedition.tribeGift',
    context: ({ random }) => ({ amount: Math.round(100 + 400 * random) }),
    action: ({ random }) => Treasure.gain(Math.round(100 + 400 * random)),
    probability: 2,
  },
  {
    name: 'expedition.survivorsFound',
    action: ({ unit }) => Unit.create('settler', unit.mapCoordinates, unit.owner),
    probability: 0.5,
  },
  {
    name: 'expedition.ruinsDiscovery',
    context: ({ random }) => ({ amount: Math.round(2000 + 5000 * random) }),
    action: ({ random, unit }) => {
      const treasure = Unit.create('treasure', unit.mapCoordinates, unit.owner)
      treasure.treasure = Math.round(2000 + 5000 * random)
    },
    probability: 0.2,
  },
  {
    name: 'expedition.cibola',
    context: ({ random }) => ({ amount: Math.round(10000 + 20000 * random) }),
    action: ({ random, unit }) => {
      const treasure = Unit.create('treasure', unit.mapCoordinates, unit.owner)
      treasure.treasure = Math.round(10000 + 20000 * random)
    },
    probability: 0.05,
  },
  {
    name: 'expedition.fountainOfYouth',
    action: () => Europe.update.crosses(200),
    probability: 0.025,
  },
  {
    name: 'expedition.trespassingWarning',
    context: ({ unit }) => {
      const tribe = Record.getAll('tribe').find(tribe => {
        const relations = tribe.owner.ai.state.relations[unit.owner.referenceId]
        if (relations) {
          return true
        }
      })

      return {
        tribe
      }
    },
    action: () => {},
    probability: 0.1,
  },
]


export default unit => {
  const totalProbabilities = options.reduce((sum, option) => sum + option.probability, 0)
  const option = options.reduce(
    (current, option) =>
      current.sum > 0 ? { ...option, sum: current.sum - option.probability } : current,
    { sum: totalProbabilities * Math.random() }
  )

  const random = Math.random()
  const tile = MapEntity.tile(unit.mapCoordinates)
  const evaluatedOption = {
    name: option.name,
    context: {
      unit,
      random,
      ...(option.context ? option.context({ unit, random }) : {}),
      action: () => option.action({ unit, random }),
    }
  }

  Events.trigger('notification', {
    type: 'rumor',
    option: evaluatedOption,
    tile,
    unit,
  })
}
