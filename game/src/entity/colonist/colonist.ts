import $ from 'signal-chain'

import type { ColonistEntity } from "./types"
import type { UnitEntity } from "ui/overlay/Unit"

import Record from 'util/record'
import Time from 'timeline/time'
import Storage from 'entity/storage'

import ProductionSummary from 'task/colony/productionSummary'

import Actions from './actions'

const createBreakdown = () => ({
  food: {},
  wood: {},
  luxury: {},
  bonus: {},
  promotion: {},
})

const createState = () => ({
  food: true,
  wood: true,
  luxury: false,
  bonus: false,
  promotion: false,
})

export const initialize = (colonist: ColonistEntity) => {
  colonist.productionRecord = Storage.createWithProduction()
  colonist.consumptionRecord = Storage.createWithProduction()
  // the summary is a snapshot created at a reasonable time
  // that can always be displayed
  colonist.productionSummary = Storage.createWithProduction()
  colonist.consumptionSummary = Storage.createWithProduction()

  colonist.consumptionBreakdown = {
    want: createBreakdown(),
    has: createBreakdown(),
    state: createState()
  }

  return [
    $.connect(
      $.emit(colonist),
      $.listen.key('unit'),
      $.passIf(unit => !unit),
      $.effect(() => Actions.disband(colonist))
    ),
    Time.schedule(ProductionSummary.create(colonist)),
  ]
}

export const create = (unit: UnitEntity) => {
  const colonist = {
    type: 'colonist',
    unit,
    education: {
      profession: null,
      progress: 0,
    },
    promotion: {
      target: '',
      progress: {}
    },
    power: Math.random(),
    mood: 0,
    work: undefined,
    beingEducated: false,
    state: {
      noFood: false,
      noWood: false,
      noLuxury: false,
      isPromoting: false,
      hasBonus: false,
    },

    storage: Storage.create(),
    productionRecord: Storage.createWithProduction(),
    consumptionRecord: Storage.createWithProduction(),
    productionSummary: Storage.createWithProduction(),
    consumptionSummary: Storage.createWithProduction(),

    consumptionBreakdown: {
      want: createBreakdown(),
      has: createBreakdown(),
      state: createState()
    },

    destroy: null,
    referenceId: -1,
  } as ColonistEntity

  colonist.destroy = initialize(colonist)

  Record.add('colonist', colonist)
  return colonist
}
