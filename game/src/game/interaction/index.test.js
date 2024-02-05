import 'test/min-setup'

import Util from 'util/util'
import Interaction from 'interaction'
import Unit from 'entity/unit'
import Colony from 'entity/colony'
import Colonist from 'entity/colonist'

const ship = () => Unit.create('caravel', { x: 0, y: 5 })
const pioneer = () => Unit.create('pioneer', { x: 1, y: 2 })
const settler = () => Unit.create('settler', { x: 1, y: 2 })
const soldier = () => Unit.create('soldier', { x: 1, y: 2 })
const farmer = () => {
  const unit = settler()
  const colonist = Colonist.create(unit)
  unit.expert = 'farmer'

  return colonist
}
const jamestown = () => {
  const colony = Colony.create({ x: 1, y: 1 })
  Interaction.JoinColony(colony, farmer())
  return colony
}
const tools = () => ({ good: 'tools', amount: 79 })

test('buy from europe', () => {
  Interaction.BuyFromEurope(ship(), tools())
})

test('enter colony', () => {
  Interaction.EnterColony(jamestown(), settler())
})

test('enter europe', () => {
  Interaction.EnterEurope(ship())
})

test('equip unit from colony', () => {
  Interaction.EquipUnitFromColony(jamestown(), settler(), tools())
})

test('equip unit from ship', () => {
  Interaction.EquipUnitFromShip(ship(), settler(), tools())
})

test('fight', () => {
  Interaction.Fight(soldier(), settler())
})

test('find work', () => {
  const colonist = farmer()
  Interaction.JoinColony(jamestown(), colonist)
  Interaction.FindWork(colonist)
})

test('investigate rumors', () => {
  Util.range(150).forEach(() => {
    Interaction.InvestigateRumors(soldier())
  })
})

test('join colony', () => {
  Interaction.JoinColony(jamestown(), farmer())
})

test('leave colony', () => {
  const unit = Unit.create('settler', jamestown().mapCoordinates)
  Interaction.LeaveColony(unit)
})

test('load between ships', () => {
  Interaction.LoadBetweenShips(ship(), ship(), tools())
})

test('load from colony to ship', () => {
  Interaction.LoadFromColonyToShip(jamestown(), ship(), tools())
})

test('load from ship to colony', () => {
  Interaction.LoadFromShipToColony(jamestown(), ship(), tools())
})

test('load unit from ship to colony', () => {
  const unit = soldier()
  Unit.loadUnit(ship(), unit)
  Interaction.LoadUnitFromShipToColony(jamestown(), unit)
})

test('load unit from ship to europe', () => {
  const unit = pioneer()
  Unit.loadUnit(ship(), unit)
  Interaction.LoadUnitFromShipToEurope(unit)
})

test('load unit from ship to ship', () => {
  const unit = soldier()
  Unit.loadUnit(ship(), unit)
  Interaction.LoadUnitFromShipToShip(ship(), unit)
})

test('load unit to ship', () => {
  Interaction.LoadUnitToShip(ship(), settler())
})

test('sell in europe', () => {
  Interaction.SellInEurope(ship(), tools())
})

test('shrink from starvation', () => {
  Interaction.ShrinkFromStarvation(jamestown())
})

test('unjoin colony', () => {
  Interaction.UnjoinColony(jamestown().colonists[0])
})
