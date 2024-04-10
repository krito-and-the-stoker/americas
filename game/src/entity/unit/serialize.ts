import UnitData from 'data/units.json'

import Message from 'util/message'
import Record from "util/record"

import Storage from 'entity/storage'

import Commander from 'command/commander'
import Factory from 'command/factory'

import type { UnitEntity } from "./types"
import type { ColonyEntity } from 'entity/colony/types'
import type { ColonistEntity } from 'entity/colonist/types'

import { initialize } from './unit'


const save = (unit: UnitEntity) => ({
  name: unit.name,
  treasure: unit.treasure,
  domain: unit.domain,
  mapCoordinates: unit.mapCoordinates,
  expert: unit.expert,
  storage: Storage.save(unit.storage),
  equipment: Storage.save(unit.equipment),
  offTheMap: unit.offTheMap,
  commander: unit.commander.save(),
  colony: Record.reference(unit.colony),
  colonist: Record.reference(unit.colonist),
  passengers: unit.passengers.map(other => Record.reference(other)),
  vehicle: Record.reference(unit.vehicle),
  pioneering: unit.pioneering,
  tile: Record.referenceTile(unit.tile),
  owner: Record.reference(unit.owner),
  radius: unit.radius,
  isBoarding: unit.isBoarding,
  movement: {
    target: Record.referenceTile(unit.movement.target),
  },
})

const load = (unit: any): UnitEntity => {
  // @ts-ignore lookup
  unit.properties = UnitData[unit.name]
  unit.storage = Storage.load(unit.storage)
  unit.equipment = Storage.load(unit.equipment)
  unit.passengers = unit.passengers.map(Record.dereference)
  unit.owner = Record.dereference(unit.owner)
  unit.tile = Record.dereferenceTile(unit.tile)
  unit.movement = {
    target: Record.dereferenceTile(unit.movement.target),
  }

  unit.consumptionRecord = Storage.createWithProduction()
  unit.consumptionSummary = Storage.createWithProduction()

  Record.dereferenceLazy(unit.colony, (colony: ColonyEntity) => (unit.colony = colony))
  Record.dereferenceLazy(unit.colonist, (colonist: ColonistEntity) => (unit.colonist = colonist))
  Record.dereferenceLazy(unit.vehicle, (vehicle: ColonyEntity) => (unit.vehicle = vehicle))
  Record.entitiesLoaded(() => {
    Message.command.log(unit.commander)
    unit.commander = Commander.load(unit.commander)
    Factory.printCommandTree(unit.commander)
    unit.destroy = initialize(unit)
  })

  return unit
}

export {
  save,
  load,
}