import Binding from 'util/binding'
import Member from 'util/member'

export const add = {
  unit: (colony, unit) => Member.add(colony, 'units', unit),
  colonist: (colony, colonist) => Member.add(colony, 'colonists', colonist),
}

export const remove = {
  unit: unit => Member.remove(unit.colony, 'units', unit),
  colonist: colonist => Member.remove(colonist.colony, 'colonists', colonist),
}

export const listen = {
  units: (colony, fn) => Binding.listen(colony, 'units', fn),
  colonists: (colony, fn) => Binding.listen(colony, 'colonists', fn),
  construction: (colony, fn) => Binding.listen(colony, 'construction', fn),
  constructionTarget: (colony, fn) => Binding.listen(colony, 'constructionTarget', fn),
  bells: (colony, fn) => Binding.listen(colony, 'bells', fn),
  growth: (colony, fn) => Binding.listen(colony, 'growth', fn),
  newBuildings: (colony, fn) => Binding.listen(colony, 'newBuildings', fn),
  productionBonus: (colony, fn) => Binding.listen(colony, 'productionBonus', fn),
  supportedUnits: (colony, fn) => Binding.listen(colony, 'supportedUnits', fn),
}

export const listenEach = {
  units: (colony, fn) => Member.listenEach(colony, 'units', fn),
}

export const update = {
  construction: (colony, value) => Binding.update(colony, 'construction', value),
  constructionTarget: (colony, value) => Binding.update(colony, 'constructionTarget', value),
  newBuildings: (colony, value) => Binding.update(colony, 'newBuildings', value),
  bells: (colony, value) => Binding.update(colony, 'bells', colony.bells + value),
  crosses: (colony, value) => Binding.update(colony, 'crosses', colony.crosses + value),
  housing: (colony, value) => Binding.update(colony, 'housing', colony.housing + value),
  growth: (colony, value) => Binding.update(colony, 'growth', colony.growth + value),
  productionBonus: (colony, value) => Binding.update(colony, 'productionBonus', value),
  supportedUnits: (colony, value) => Binding.update(colony, 'supportedUnits', value),
}
