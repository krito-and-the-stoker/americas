import Message from 'util/message'

import Time from 'timeline/time'

import Europe from 'entity/europe'
import Unit from 'entity/unit'
import Storage from 'entity/storage'

import Factory from 'command/factory'

const TRAVEL_EQUIPMENT_FACTOR = 1
export default Factory.create(
  'America',
  {
    unit: {
      type: 'entity',
      required: true,
    },
    progress: {
      type: 'raw',
    },
    direction: {
      type: 'raw',
    },
  },
  {
    id: 'america',
    display: 'Travelling to the Americas',
  },
  state => {
    const { unit } = state

    const init = () => {
      if (!Europe.has.unit(unit)) {
        Message.unit.warn('unit is not in europe', Unit.name(unit))
        return false
      }

      Europe.remove.unit(unit)

      return {
        direction: 1,
        progress: 0,
      }
    }

    const update = (currentTime, deltaTime) => {
      state.progress += state.direction * (deltaTime / Time.EUROPE_SAIL_TIME)
      if (Unit.TRAVEL_EQUIPMENT[unit.properties.travelType]) {
        Unit.TRAVEL_EQUIPMENT[unit.properties.travelType].forEach(good => {
          unit.equipment[good] = Math.max(
            unit.equipment[good] -
              (TRAVEL_EQUIPMENT_FACTOR * deltaTime) / Time.EUROPE_SAIL_TIME,
            0
          )
        })
        Storage.update(unit.equipment)
      }

      return state.progress >= 0 && state.progress <= 1
    }

    const finished = () => {
      if (state.progress >= 1) {
        Message.command.log(`A ${Unit.name(unit)} arrived in the new world.`)
        Unit.update.offTheMap(unit, false)
      } else {
        Message.command.log(`A ${Unit.name(unit)} arrived back in Europe.`)
        Europe.add.unit(unit)
      }
    }

    const cancel = () => {
      state.direction *= -1
    }

    return {
      init,
      cancel,
      update,
      finished,
    }
  }
)
