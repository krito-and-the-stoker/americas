import Colonist from 'entity/colonist'

const byPower = (one, other) => Colonist.power(other) - Colonist.power(one)

const create = colony => {
  const update = (currentTime, deltaTime) => {
    colony.colonists.sort(byPower)

    return true
  }

  return {
    update,
    sort: 1,
  }
}

export default {
  create
}
