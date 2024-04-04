import Binding from 'util/binding'

export const listen = {
  work: (colonist, fn) => Binding.listen(colonist, 'work', fn),
  state: (colonist, fn) => Binding.listen(colonist, 'state', fn),
  colony: (colonist, fn) => Binding.listen(colonist, 'colony', fn),
  unit: (colonist, fn) => Binding.listen(colonist, 'unit', fn),
  promotion: (colonist, fn) => Binding.listen(colonist, 'promotion', fn),
  beingEducated: (colonist, fn) => Binding.listen(colonist, 'beingEducated', fn),
  expert: (colonist, fn) => Unit.listen.expert(colonist.unit, fn), // legacy, will be removed
  consumptionBreakdown: (colonist, fn) => Binding.listen(colonist, 'consumptionBreakdown', fn),
}

export const update = {
  work: (colonist, value) => Binding.update(colonist, 'work', value),
  state: (colonist, value) => Binding.update(colonist, 'state', value),
  colony: (colonist, value) => Binding.update(colonist, 'colony', value),
  unit: (colonist, value) => Binding.update(colonist, 'unit', value),
  promotion: (colonist, value) => Binding.update(colonist, 'promotion', value),
  beingEducated: (colonist, value) => Binding.update(colonist, 'beingEducated', value),
  expert: (colonist, value) => Unit.update.expert(colonist.unit, value), // legacy, will be removed
  consumptionBreakdown: (colonist, value) => Binding.update(colonist, 'consumptionBreakdown', value),
}
