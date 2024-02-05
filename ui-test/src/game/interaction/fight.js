import Util from 'util/util'
import LA from 'util/la'
import Message from 'util/message'
import Events from 'util/events'

import Unit from 'entity/unit'
import Storage from 'entity/storage'

const RADIUS_FIGHT_COST = 0.995
const RADIUS_HIT_FRACTION = 0.01
const EQUIPMENT_LOSS_FACTOR = 0.9975
const DISPLACEMENT_FACTOR = 0.01

export default (attacker, other) => {
  if (!Util.inBattleDistance(attacker, other)) {
    return false
  }

  const defender = other

  Unit.update.radius(attacker, attacker.radius * RADIUS_FIGHT_COST)
  Unit.update.radius(defender, defender.radius * RADIUS_FIGHT_COST)

  const strength = {
    attacker: Unit.strength(attacker),
    defender: Unit.strength(defender),
  }

  const chance = Math.random() * (strength.attacker + strength.defender)

  let loser = null
  let winner = null
  if (chance < strength.attacker) {
    loser = defender
    winner = attacker
  } else {
    loser = attacker
    winner = defender
  }

  Unit.update.radius(
    loser,
    loser.radius - RADIUS_HIT_FRACTION * loser.properties.radius * Unit.strength(winner)
  )

  // if loser is still ok
  if (loser.radius > 0) {
    Storage.goods(loser.equipment).forEach(({ good }) => {
      if (good !== 'food') {
        loser.equipment[good] *= EQUIPMENT_LOSS_FACTOR
      }
    })

    // push if not in colony
    if (!loser.colony) {
      const pushDirection = LA.normalize(
        LA.subtract(loser.mapCoordinates, winner.mapCoordinates)
      )
      const newPlace = LA.madd(
        loser.mapCoordinates,
        Unit.speed(loser) * DISPLACEMENT_FACTOR,
        pushDirection
      )
      Unit.update.mapCoordinates(loser, newPlace)
    }

    if (loser.radius < 0.1 * loser.properties.radius) {
      Events.trigger('retreat', { unit: loser })
    }
    // if loser is not ok anymore...
  } else {
    Message.send(`A ${Unit.name(winner)} defeated a ${Unit.name(loser)} on the battle field`)

    if (loser.properties.defeated) {
      if (loser.properties.defeated.transfer) {
        loser.properties.defeated.transfer.forEach(good => {
          Storage.transfer(loser.equipment, winner.equipment, {
            good,
          })
        })
      }
    }
    if (!loser.properties.defeated) {
      Unit.disband(loser)
    }

    const coords = {
      x: (attacker.mapCoordinates.x + defender.mapCoordinates.x) / 2,
      y: (attacker.mapCoordinates.y + defender.mapCoordinates.y) / 2,
    }
    Events.trigger('combat', {
      coords,
      attacker,
      defender,
      loser,
      strength,
    })
  }
}
