import Buildings from 'entity/buildings'


const production = (colony, building, colonist) => {
  if (!Buildings[building.name]?.production) {
    return 0
  }

  if (colonist.unit?.expert === 'slave') {
    return 0
  }

  let { amount, good } = Buildings[building.name].production(building, colonist)
  if (amount > 0) {
    amount += colony.productionBonus
  }
  if (colonist.unit?.expert === 'criminal') {
    amount -= 2
  }
  if (colonist.unit?.expert === 'servant') {
    amount -= 1
  }

  if (amount > 0) {
    if (colonist.state.noFood) {
      amount *= 0.5
      amount = Math.floor(amount)
    }
    if (colonist.state.noWood) {
      amount -= 1
    }
    if (colonist.state.hasBonus) {
      amount += 1
    }
  }

  amount = Math.ceil(amount)
  if (amount < 0) {
    amount = 0
  }

  const type = ['crosses', 'bells', 'construction'].includes(good) ? good : 'good'

  return {
    amount,
    good,
    type,
  }
}

const consumption = building => {
  if (!Buildings[building.name]?.consumption) {
    return null
  }

  return Buildings[building.name].consumption(building)
}


export default {
  production,
  consumption,
}
