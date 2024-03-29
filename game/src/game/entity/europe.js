import Colonists from 'data/colonists'

import Record from 'util/record'
import Member from 'util/member'
import Binding from 'util/binding'
import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import Time from 'timeline/time'

import TransferCrosses from 'task/transferCrosses'

import Unit from 'entity/unit'
import Treasure from 'entity/treasure'
import Owner from 'entity/owner'
import Trade from 'entity/trade'
import Storage from 'entity/storage'
import Market from 'entity/market'

// for immigration at the docks of europe
const INITIAL_CROSSES_NEEDED = 8
const CROSSES_COST_IMPROVE = 3

const basePool = [
  { unit: 'settler', name: 'Petty Criminals', expert: 'criminal' },
  { unit: 'settler', name: 'Servants', expert: 'servant' },
  { unit: 'settler', name: 'Settler', expert: null },
]

const TRAINING_PRICE_FACTOR = 2
const possibleTrainees = [
  {
    unit: 'settler',
    name: 'Expert Oreminer',
    expert: 'oreminer',
    price: TRAINING_PRICE_FACTOR * 600,
  },
  {
    unit: 'settler',
    name: 'Expert Lumberjack',
    expert: 'lumberjack',
    price: TRAINING_PRICE_FACTOR * 700,
  },
  {
    unit: 'settler',
    name: 'Expert Gunsmith',
    expert: 'gunsmith',
    price: TRAINING_PRICE_FACTOR * 850,
  },
  {
    unit: 'settler',
    name: 'Expert Silverminer',
    expert: 'silverminer',
    price: TRAINING_PRICE_FACTOR * 900,
  },
  {
    unit: 'settler',
    name: 'Master Furtrader',
    expert: 'furtrader',
    price: TRAINING_PRICE_FACTOR * 950,
  },
  {
    unit: 'settler',
    name: 'Expert Carpenter',
    expert: 'carpenter',
    price: TRAINING_PRICE_FACTOR * 1000,
  },
  {
    unit: 'settler',
    name: 'Expert Fisher',
    expert: 'fisher',
    price: TRAINING_PRICE_FACTOR * 1000,
  },
  {
    unit: 'settler',
    name: 'Expert Blacksmith',
    expert: 'blacksmith',
    price: TRAINING_PRICE_FACTOR * 1050,
  },
  {
    unit: 'settler',
    name: 'Expert Farmer',
    expert: 'farmer',
    price: TRAINING_PRICE_FACTOR * 1100,
  },
  {
    unit: 'settler',
    name: 'Master Distiller',
    expert: 'distiller',
    price: TRAINING_PRICE_FACTOR * 1100,
  },
  {
    unit: 'pioneer',
    name: 'Hardened Pioneer',
    expert: 'pioneer',
    price: TRAINING_PRICE_FACTOR * 1200,
  },
  {
    unit: 'settler',
    name: 'Master Tobacconist',
    expert: 'tobacconist',
    price: TRAINING_PRICE_FACTOR * 1200,
  },
  {
    unit: 'settler',
    name: 'Master Weaver',
    expert: 'weaver',
    price: TRAINING_PRICE_FACTOR * 1300,
  },
  {
    unit: 'missionary',
    name: 'Jesuit Missionary',
    expert: 'missionary',
    price: TRAINING_PRICE_FACTOR * 1400,
  },
  {
    unit: 'settler',
    name: 'Firebrand Preacher',
    expert: 'preacher',
    price: TRAINING_PRICE_FACTOR * 1500,
  },
  {
    unit: 'settler',
    name: 'Elder Statesman',
    expert: 'statesman',
    price: TRAINING_PRICE_FACTOR * 1900,
  },
  {
    unit: 'soldier',
    name: 'Veteran Soldiers',
    expert: 'soldier',
    price: TRAINING_PRICE_FACTOR * 2000,
  },
]

const europe = {
  units: [],
  crosses: 0,
  crossesNeeded: INITIAL_CROSSES_NEEDED,
  trade: Trade.create(),
  destroy: null,
}

const add = {
  unit: unit => Member.add(europe, 'units', unit),
}

const remove = {
  unit: unit => Member.remove(europe, 'units', unit),
}

const listenEach = {
  units: fn => Member.listenEach(europe, 'units', fn),
}

const has = {
  unit: unit => Member.has(europe, 'units', unit),
}

const listen = {
  units: fn => Binding.listen(europe, 'units', fn),
  crosses: fn => Binding.listen(europe, 'crosses', fn),
  trade: fn => Binding.listen(europe, 'trade', fn),
}

const update = {
  crosses: value => Binding.update(europe, 'crosses', europe.crosses + value),
  trade: () => Binding.update(europe, 'trade'),
}

const save = () => ({
  units: europe.units.map(Record.reference),
  crosses: europe.crosses,
  crossesNeeded: europe.crossesNeeded,
  trade: Trade.save(europe.trade),
})

const load = data => {
  europe.units = data.units.map(Record.dereference)
  europe.crosses = data.crosses
  europe.crossesNeeded = data.crossesNeeded
  europe.trade = Trade.load(data.trade)

  initialize()
}

const trade = () => europe.trade

const purchaseOptions = () =>
  [
    // { name: 'Slave', unit: 'slave', price: 500 },
    { name: 'Artillery', unit: 'artillery', price: 1000 },
    { name: 'Caravel', unit: 'caravel', price: 2500 },
    { name: 'Merchantman', unit: 'merchantman', price: 5000 },
    { name: 'Privateer', unit: 'privateer', price: 5000 },
    { name: 'Galleon', unit: 'galleon', price: 10000 },
    { name: 'Frigate', unit: 'frigate', price: 15000 },
  ]
    .map(option => ({
      ...option,
      disabled: Treasure.amount() < option.price,
      action: () => purchase(option),
    }))

const purchase = option => {
  if (Treasure.spend(option.price) && option.unit) {
    const unit = Unit.create(
      option.unit,
      Record.getGlobal('defaultShipArrival'),
      Owner.player()
    )
    Unit.update.offTheMap(unit, true)
    add.unit(unit)
  }
}

const trainOptions = () =>
  possibleTrainees
    .map(({ unit, name, expert, price }) => ({
      name,
      price,
      disabled: Treasure.amount() < price,
      action: () => train({ unit, expert, price }),
    }))

const train = option => {
  if (Treasure.spend(option.price) && option.unit) {
    const unit = Unit.create(
      option.unit,
      Record.getGlobal('defaultShipArrival'),
      Owner.player()
    )
    Unit.update.expert(unit, option.expert)
    Unit.update.offTheMap(unit, true)
    add.unit(unit)
  }
}

const repairShipCost = unit => {
  const goodsNeeded = Storage.goods(unit.equipment)
    .filter(pack => unit.properties.equipment[pack.good])
    .map(pack => ({
      good: pack.good,
      amount: Math.max(unit.properties.equipment[pack.good] - pack.amount, 0),
    }))

  return Math.round(
    goodsNeeded.reduce((sum, { good, amount }) => Market.ask(good) * amount + sum, 0)
  )
}

const repairShip = unit => {
  const cost = repairShipCost(unit)
  Treasure.spend(cost)
  Object.entries(unit.properties.equipment).forEach(([good, amount]) => {
    unit.equipment[good] = amount
  })
  Storage.update(unit.equipment)
}

const initialize = () => {
  Util.execute(europe.destroy)
  europe.destroy = [
    Time.schedule(TransferCrosses.create()),
    listen.crosses(crosses => {
      if (crosses >= europe.crossesNeeded) {
        const choices =
          europe.crossesNeeded === INITIAL_CROSSES_NEEDED
            ? [{ unit: 'pioneer', name: 'Pioneer', expert: null }]
            : basePool.concat(
                Record.getAll('colonist')
                  .filter(
                    colonist =>
                      colonist.mood > 0 ||
                      ['criminal', 'servant'].includes(colonist.unit.expert)
                  )
                  .filter(
                    colonist => (Colonists[colonist.unit.expert] || Colonists.default).europe
                  )
                  .map(colonist => ({
                    unit: 'settler',
                    name: Unit.name(colonist.unit),
                    expert: colonist.unit.expert,
                  }))
              )

        const chosen = Util.choose(choices)
        const unit = Unit.create(
          chosen.unit,
          Record.getGlobal('defaultShipArrival'),
          Owner.player()
        )
        Unit.update.expert(unit, chosen.expert)
        Unit.update.offTheMap(unit, true)
        add.unit(unit)
        update.crosses(-europe.crossesNeeded)
        europe.crossesNeeded += CROSSES_COST_IMPROVE
        Events.trigger('notification', { type: 'immigration', unit })
        Events.trigger('immigration')
        Message.europe.log(
          `Religious unrest in Europe has caused a ${chosen.name} to line up for migration to the new world.`
        )
      }
    }),
  ]
  Message.europe.log('Europe initialized')
}

export default {
  add,
  remove,
  has,
  listen,
  listenEach,
  update,
  save,
  load,
  trade,
  purchaseOptions,
  purchase,
  trainOptions,
  train,
  repairShip,
  repairShipCost,
  initialize,
}
