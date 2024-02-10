import 'util/polyfills'

import UnitProperties from 'data/units'

import Util from 'util/util'
import Binding from 'util/binding'
import Record from 'util/record'
import Events from 'util/events'
import Message from 'util/message'

import Time from 'timeline/time'

import Fight from 'interaction/fight'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Tribe from 'entity/tribe'
import Colony from 'entity/colony'
import Unit from 'entity/unit'

import EstablishRelations from 'ai/actions/establishRelations'
import Disband from 'ai/actions/disband'
import VisitColony from 'ai/actions/visitColony'
import RaidColonies from 'ai/actions/raidColonies'

import State from 'ai/state'
import Units from 'ai/resources/units'
import Goods from 'ai/resources/goods'

const PRODUCTION_BASE_FACTOR = 1.0 / Time.PRODUCTION_BASE_TIME
const MILITANCY_UPDATE_FACTOR = 0.02 * PRODUCTION_BASE_FACTOR
const OVERPOPULATION_FACTOR = 0.01 * PRODUCTION_BASE_FACTOR
const TRUST_DAMPING_FACTOR = 0.995
const MILITANCY_DAMPING_FACTOR = 0.9995

const describeRelations = relations => {
  const debugInfo = `(trust: ${relations.trust.toFixed(2)}, mil: ${relations.militancy.toFixed(2)})`
  if (relations.militancy > 0.5) {
    if (relations.trust >= 0.5) {
      return `respectful ${debugInfo}`
    }

    if (relations.trust >= 0) {
      return `proud ${debugInfo}`
    }

    return `hostile ${debugInfo}`
  }

  if (relations.militancy > 0) {
    if (relations.trust >= 0.5) {
      return `friendly ${debugInfo}`
    }

    if (relations.trust >= 0) {
      return `neutral ${debugInfo}`
    }

    return `tense ${debugInfo}`
  }

  if (relations.trust >= 0.5) {
    return `happy ${debugInfo}`
  }

  if (relations.trust >= 0) {
    return `cordial ${debugInfo}`
  }

  return `submissive ${debugInfo}`
}

const hasRaidPlanned = relation => relation.raidPlanned > 0
const isHostile = relation =>
  (relation.trust < 0 && relation.militancy > 0.5) || hasRaidPlanned(relation)
const seemsHostile = relation =>
  (relation.trust < 0 && relation.militancy > 0) || hasRaidPlanned(relation)

const initialize = ai => {
  Util.execute(ai.destroy)

  return [
    listen.tribe(
      ai,
      tribe =>
        tribe &&
        Tribe.listen.settlements(tribe, settlements => {
          const tiles = settlements
            .map(settlement => Util.quantizedRadius(settlement.mapCoordinates, 6))
            .flat()
            .map(coords => MapEntity.tile(coords))
            .filter(Util.unique)
            .filter(tile => tile.domain === 'land')
            .filter(tile =>
              settlements
                .map(settlement => MapEntity.tile(settlement.mapCoordinates).area.foot)
                .includes(tile.area.foot)
            )
          // for all tiles near settlements:
          return tiles.map(tile => [
            // greet unknowns
            Tile.listen.units(tile, units => {
              units
                .filter(unit => unit.domain !== 'sea' && !unit.vehicle)
                .map(unit => unit.owner)
                .filter(owner => owner !== ai.owner)
                .forEach(owner => {
                  if (!ai.state.relations[owner.referenceId]) {
                    ai.state.relations[owner.referenceId] = {
                      established: false,
                      colonies: {},
                      militancy: 0,
                      trust: 0,
                    }

                    update.state(ai)
                  }
                })
            }),

            // register foreign colony
            Tile.listen.colony(tile, colony => {
              if (
                colony &&
                !ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId]
              ) {
                ai.state.relations[colony.owner.referenceId].colonies[colony.referenceId] = {
                  visited: false,
                }
                update.state(ai)

                return () => {
                  delete ai.state.relations[colony.owner.referenceId].colonies[
                    colony.referenceId
                  ]
                }
              }
            }),

            // register pioneers work
            !tile.road &&
              Tile.listen.road(tile, road => {
                if (road && !tile.colony) {
                  const pioneer = tile.units.find(
                    unit => unit.name === 'pioneer' || unit.name === 'settler'
                  )
                  if (pioneer) {
                    const relation = ai.state.relations[pioneer.owner.referenceId]
                    if (relation) {
                      relation.trust -= 0.05
                    }
                    Message.log(`road built registered by ${tribe.name}`)
                  }
                }
              }),
            !tile.plowed &&
              Tile.listen.plowed(tile, plowed => {
                if (plowed && !tile.colony) {
                  const pioneer = tile.units.find(
                    unit => unit.name === 'pioneer' || unit.name === 'settler'
                  )
                  if (pioneer) {
                    const relation = ai.state.relations[pioneer.owner.referenceId]
                    if (relation) {
                      relation.trust -= 0.05
                    }
                    Message.log(`plowed registered by ${tribe.name}`)
                  }
                }
              }),
            tile.forest &&
              Tile.listen.forest(tile, forest => {
                if (!forest && !tile.colony) {
                  const pioneer = tile.units.find(
                    unit => unit.name === 'pioneer' || unit.name === 'settler'
                  )
                  if (pioneer) {
                    const relation = ai.state.relations[pioneer.owner.referenceId]
                    if (relation) {
                      relation.trust -= 0.05
                    }
                    Message.log(`cut forest registered by ${tribe.name}`)
                  }
                }
              }),
          ])
        })
    ),

    listen.state(ai, () => {
      makePlansAndRunThem(ai)
    }),

    Time.schedule({
      update: (currentTime, deltaTime) => {
        Object.values(ai.state.relations).forEach(relation => {
          const overPopulation = Util.sum(
            State.all(relation, 'colonies').map(colony =>
              Math.floor(colony.colonists.length / 4)
            )
          )
          relation.militancy = Util.clamp(
            MILITANCY_DAMPING_FACTOR * relation.militancy -
              deltaTime * MILITANCY_UPDATE_FACTOR * relation.trust,
            -1,
            5
          )
          relation.trust = Util.clamp(
            TRUST_DAMPING_FACTOR * relation.trust -
              OVERPOPULATION_FACTOR * deltaTime * overPopulation,
            -1,
            1
          )
        })

        return true
      },
    }),

    Events.listen('meet', ({ unit, other }) => {
      if (unit && other) {
        const relation = ai.state.relations[other.owner.referenceId]
        if (relation) {
          // establish relations
          if (unit.owner === ai.owner && other.domain === 'land' && !relation.established) {
            establishRelations(ai, other.owner)
          }
          // battle when in war
          if (isHostile(relation) && Unit.strength(unit) >= Unit.strength(other)) {
            if (unit.domain === other.domain) {
              if (unit.owner === ai.owner && !other.colony) {
                Fight(unit, other)
              }
            }
          }
        }
      }
    }),
  ]
}

const establishRelations = (ai, owner) => {
  ai.state.relations[owner.referenceId].established = true
  if (owner.type === 'player') {
    const numSettlements = Record.getAll('settlement').filter(
      settlement => settlement.tribe === ai.tribe
    ).length

    Events.trigger('ui-dialog', {
      name: 'natives.establish',
      context: {
        tribe: ai.tribe,
        numSettlements,
        yes: () => {
          ai.state.relations[owner.referenceId].trust += 0.15
          update.state(ai)
        },
        no: () => {
          ai.state.relations[owner.referenceId].trust -= 0.5
          ai.state.relations[owner.referenceId].militancy += 0.2
          update.state(ai)
        }
      }
    })
  }
}

const makePlansAndRunThem = ai => {
  Util.execute(ai.stopAllPlans)

  let plansActive = 0
  const executeAction = action => {
    if (action) {
      plansActive += 1
      action.commit().then(() => {
        plansActive -= 1
        if (!plansActive) {
          makePlansAndRunThem(ai)
        }
      })
      return () => {
        plansActive -= 1
        Util.execute(action.cancel)
      }
    }
  }

  Time.schedule({
    init: () => {
      Units.unassignAll(ai.owner)


      Object.values(ai.state.relations)
        // TODO: should be relation.militancy > 0.5
        .filter(
          relation =>
            relation.trust < 0 &&
            relation.militancy > 1.5 &&
            // only if we have established relations yet
            State.all(relation, 'colonies').some(colony => true) &&
            // wait until currently planned raids are over
            !hasRaidPlanned(relation)
        )
        .forEach(relation => {
          relation.raidPlanned = 0

          // relation.militancy = 0.0
          // relation.trust *= 0.5
        })

      ai.stopAllPlans = [
        // establish contact with all strangers
        State.all(ai.state, 'relations')
          .filter(contact => !ai.state.relations[contact.referenceId].established)
          .map(contact => EstablishRelations.create({ owner: ai.owner, contact }))
          .map(executeAction),

        // visit new colonies
        Object.entries(ai.state.relations)
          .filter(([, relation]) => relation.trust > 0)
          .map(([referenceId, relation]) =>
            State.all(relation, 'colonies')
              .filter(
                colony =>
                  colony &&
                  (!ai.state.relations[referenceId].colonies[colony.referenceId].visited ||
                    ai.state.relations[referenceId].colonies[colony.referenceId].visited <
                      Time.now() - (1.5 - relation.trust) * Time.YEAR)
              )
              .map(colony =>
                VisitColony.create({
                  tribe: ai.tribe,
                  state: ai.state,
                  colony,
                })
              )
              .map(executeAction)
          ),

        // raid colonies
        State.all(ai.state, 'relations')
          .filter(owner => ai.state.relations[owner.referenceId].raidPlanned > 0)
          .map(owner =>
            RaidColonies.create({
              tribe: ai.tribe,
              state: ai.state,
              owner,
            })
          )
          .map(executeAction),

        // collect free and unused units
        Units.free(ai.owner)
          .map(unit => Disband.create(unit))
          .map(executeAction),
      ]

      if (!plansActive) {
        makePlansAndRunThem(ai)
      }
    },
  })
}

const create = owner => {
  const ai = {
    owner,
    tribe: null,
    contacts: [],
    state: {
      relations: {},
    },
  }

  ai.destroy = initialize(ai)

  return ai
}

const load = ai => {
  Record.dereferenceLazy(ai.owner, owner => {
    ai.owner = owner
  })

  Record.entitiesLoaded(() => {
    ai.tribe = Record.dereference(ai.tribe)
    initialize(ai)
  }, 100)

  return ai
}

const save = ai => ({
  owner: Record.reference(ai.owner),
  tribe: Record.reference(ai.tribe),
  state: ai.state,
})

const listen = {
  state: (ai, fn) => Binding.listen(ai, 'state', fn),
  tribe: (ai, fn) => Binding.listen(ai, 'tribe', fn),
}

const update = {
  state: ai => Binding.update(ai, 'state'),
  tribe: (ai, value) => Binding.update(ai, 'tribe', value),
}

export default {
  create,
  update,
  listen,
  load,
  save,
  isHostile,
  seemsHostile,
  describeRelations,
}
