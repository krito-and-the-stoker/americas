import Member from "util/member"
import Binding from "util/binding"


export const add = {
  passenger: (unit, passenger) => Member.add(unit, 'passengers', passenger),
}

export const remove = {
  passenger: passenger => Member.remove(passenger.vehicle, 'passengers', passenger),
}

export const computed = {
  pioneering: (unit, fn) =>
    listen.command(
      unit,
      Binding.map(command => command && ['cutForest', 'plow', 'road'].includes(command.id), fn)
    ),
}

export const listen = {
  passengers: (unit, fn) => Binding.listen(unit, 'passengers', fn),
  vehicle: (unit, fn) => Binding.listen(unit, 'vehicle', fn),
  offTheMap: (unit, fn) => Binding.listen(unit, 'offTheMap', fn),
  colonist: (unit, fn) => Binding.listen(unit, 'colonist', fn),
  mapCoordinates: (unit, fn) => Binding.listen(unit, 'mapCoordinates', fn),
  colony: (unit, fn) => Binding.listen(unit, 'colony', fn),
  properties: (unit, fn) => Binding.listen(unit, 'properties', fn),
  name: (unit, fn) => Binding.listen(unit, 'name', fn),
  expert: (unit, fn) => Binding.listen(unit, 'expert', fn),
  tile: (unit, fn) => Binding.listen(unit, 'tile', fn),
  radius: (unit, fn) => Binding.listen(unit, 'radius', fn),
  command: (unit, fn) => Binding.listen(unit, 'command', fn),
  isBoarding: (unit, fn) => Binding.listen(unit, 'isBoarding', fn),
}

export const update = {
  vehicle: (unit, value) => Binding.update(unit, 'vehicle', value),
  offTheMap: (unit, value) => Binding.update(unit, 'offTheMap', value),
  colonist: (unit, value) => Binding.update(unit, 'colonist', value),
  mapCoordinates: (unit, value) => Binding.update(unit, 'mapCoordinates', value),
  colony: (unit, value) => Binding.update(unit, 'colony', value),
  properties: (unit, value) => Binding.update(unit, 'properties', value),
  name: (unit, value) => Binding.update(unit, 'name', value),
  expert: (unit, value) => Binding.update(unit, 'expert', value),
  tile: (unit, value) => Binding.update(unit, 'tile', value),
  radius: (unit, value) => Binding.update(unit, 'radius', value),
  command: (unit, value) => Binding.update(unit, 'command', value),
  isBoarding: (unit, value) => Binding.update(unit, 'isBoarding', value),
}