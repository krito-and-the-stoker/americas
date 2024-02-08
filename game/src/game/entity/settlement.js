import Record from 'util/record'
import Util from 'util/util'
import Binding from 'util/binding'

import Time from 'timeline/time'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'
import Unit from 'entity/unit'
import Treasure from 'entity/treasure'
import Tribe from 'entity/tribe'
import Storage from 'entity/storage'

import Commander from 'command/commander'
import LearnFromNatives from 'command/learnFromNatives'

import ConvertNatives from 'task/convertNatives'

import Bombard from 'interaction/bombard'
import Attack from 'interaction/attack'

import Natives from 'ai/natives'

const experts = {
  farmer: 'Expert Farmer',
  sugarplanter: 'Expert Sugarplanter',
  tobaccoplanter: 'Expert Tobaccoplanter',
  cottonplanter: 'Expert Cottonplanter',
  furtrapper: 'Expert Furtrapper',
  lumberjack: 'Expert Lumberjack',
  oreminer: 'Expert Oreminer',
  silverminer: 'Expert Silverminer',
  fisher: 'Expert Fisher',
}

const create = (tribe, coords, owner) => {
  const settlement = {
    mapCoordinates: coords,
    tribe,
    owner,
    presentGiven: false,
    hasLearned: false,
    lastTaxation: -Time.YEAR,
    expert: Util.choose(Object.keys(experts)),
    mission: null,
    population: Math.ceil(tribe.civilizationLevel * (1 + 3 * Math.random())),
  }

  Tile.radius(MapEntity.tile(coords)).forEach(tile => Tile.discover(tile, owner))

  Tile.radius(MapEntity.tile(coords))
    .filter(tile => tile.domain === 'land')
    .forEach(tile => Tile.update.harvestedBy(tile, settlement))

  initialize(settlement)

  Record.add('settlement', settlement)
  return settlement
}

const disband = settlement => {
  const center = MapEntity.tile(settlement.mapCoordinates)
  Tile.update.settlement(center, null)
  Tile.radius(center)
    .filter(tile => tile.domain === 'land')
    .filter(tile => tile.harvestedBy === settlement)
    .forEach(tile => Tile.update.harvestedBy(tile, null))

  Util.execute(settlement.destroy)
  Record.remove(settlement)
}

const initialize = settlement => {
  Tile.update.settlement(MapEntity.tile(settlement.mapCoordinates), settlement)
  Util.execute(settlement.destroy)
  settlement.type = 'settlement'

  settlement.destroy = [
    Tribe.add.settlement(settlement.tribe, settlement),
    listen.mission(
      settlement,
      mission => mission && Time.schedule(ConvertNatives.create(settlement, mission))
    ),
  ]
}

const dialog = (settlement, unit, answer) => {
  const relations = settlement.owner.ai.state.relations[unit.owner.referenceId]
  if (!relations) {
    return {
      name: 'settlement.no_relations'
    }
  }

  if (answer === 'food') {
    if (relations.trust < -0.3 && relations.militancy > 0.7) {
      return {
        name: 'settlement.reject',
        context: {
          threaten: () => {
            relations.trust -= 0.5
            relations.militancy += 0.2
            Natives.update.state(settlement.owner.ai)
          }
        }
      }
    }

    if (settlement.lastTaxation > Time.get().currentTime - Time.YEAR) {
      return {
        name: 'settlement.food.already_given',
      }
    }

    relations.trust -= 0.05
    relations.militancy += 0.05
    settlement.lastTaxation = Time.get().currentTime
    const amount = Math.round(settlement.population * (1 + 2 * Math.random()))
    return {
      name: {
        name: 'settlement.food.give',
        context: {
          amount,
          take: () => {
            Storage.update(unit.equipment, { good: 'food', amount })
          },
        }
      }
    }
  }

  if (answer === 'tribute') {
    if (relations.trust < -0.3 && relations.militancy > 0.7) {
      return {
        name: 'settlement.reject',
        context: {
          threaten: () => {
            relations.trust -= 0.5
            relations.militancy += 0.2
            Natives.update.state(settlement.owner.ai)
          }
        }
      }
    }

    if (settlement.lastTaxation > Time.get().currentTime - Time.YEAR) {
      return {
        name: 'settlement.tax.already_given',
      }
    }

    let good = null
    if (settlement.tribe.civilizationLevel < 3) {
      good = Util.choose([
        'food',
        'furs',
        'tobacco',
        'food',
        'furs',
        'tobacco',
        'coats',
        'cloth',
      ])
    }
    if (!good && settlement.tribe.civilizationLevel < 6) {
      good = Util.choose(['food', 'furs', 'tobacco', 'sugar', 'cotton', 'coats', 'cloth'])
    }
    if (!good) {
      good = Util.choose([
        'food',
        'tobacco',
        'sugar',
        'cotton',
        'coats',
        'cloth',
        'silver',
        'coats',
        'cloth',
        'silver',
      ])
    }
    const amount = Math.round(settlement.population * (1 + 3 * Math.random()))
    settlement.lastTaxation = Time.get().currentTime
    settlement.owner.ai.state.relations[unit.owner.referenceId].trust -= 0.1
    settlement.owner.ai.state.relations[unit.owner.referenceId].militancy += 0.1

    return {
      name: 'settlement.tax.give',
      context: {
        amount,
        good,
        take: () => {
          Storage.update(unit.equipment, { good, amount })
        }
      }
    }
  }
  if (answer === 'mission') {
    if (relations.militancy > 0.6 && relations.trust < 0) {
      return {
        name: 'settlement.mission.failed',
        context: {
          disband: () => {
            Unit.disband(unit)
          }
        }
      }
    }

    const description =
      relations.trust > 0
        ? 'with curiousity'
        : relations.militancy > 0.3
          ? 'with hostility'
          : 'cautiously'

    return {
      name: 'settlement.mission.success',
      context: {
        description,
        establish: () => {
          update.mission(settlement, unit.owner)
          Unit.disband(unit)
          relations.trust += 0.1
        }
      }
    }
  }

  if (answer === 'chief') {
    if (relations.militancy < 0.5) {
      relations.trust += 0.01
    }

    const expert = experts[settlement.expert]
    const choice = Math.random()
    if (relations.militancy > 0.4 && relations.trust < 0) {
      return {
        name: 'settlement.chief.hostile',
        context: {
          disband: () => {
            Unit.disband(unit)
          }
        }
      }
    }

    if (settlement.presentGiven || choice < 0.3) {
      settlement.presentGiven = true
      unit.equipment.food = Unit.UNIT_FOOD_CAPACITY
      Storage.update(unit.equipment)
      return {
        name: 'settlement.chief.welcome',
        context: {
          expert
        }
      }
    }
    if (choice < 0.8) {
      unit.equipment.food = Unit.UNIT_FOOD_CAPACITY
      Storage.update(unit.equipment)

      return {
        name: 'settlement.chief.welcome',
        context: {
          expert,
          discover: () => {
            settlement.presentGiven = true
            const radius = Math.round(4 * (1 + Math.random()))
            const tiles = Util.quantizedRadius(unit.mapCoordinates, radius).map(
              MapEntity.tile
            )
            tiles.forEach(tile => {
              if (Math.random() > 0.4) {
                Tile.discover(tile, unit.owner)
              }
            })
          }
        }
      }
    }

    unit.equipment.food = Unit.UNIT_FOOD_CAPACITY
    Storage.update(unit.equipment)
    const worth = Math.round(
      settlement.tribe.civilizationLevel * settlement.population * (1 + 3 * Math.random())
    )

    return {
      name: 'settlement.chief.gift',
      context: {
        expert,
        worth,
        take: () => {
          settlement.presentGiven = true
          Treasure.gain(worth)          
        }
      }
    }
  }
  if (answer === 'live') {
    if (relations.militancy > 0.2 && relations.trust < -0.5) {
      return {
        name: 'settlement.live.kill',
        context: {
          disband: () => {
            Unit.disband(unit)
          },
        }
      }
    }
    if (relations.trust < -0.2) {
      return {
        name: 'settlement.live.reject',
      }
    }

    return {
      name: 'settlement.live.accept',
      context: {
        live: () => {
          settlement.hasLearned = true
          Commander.scheduleInstead(
            unit.commander,
            LearnFromNatives.create({
              unit,
              profession: settlement.expert,
            })
          )
        }
      }
    }
  }
  if (answer === 'enter') {
    const description = Natives.describeRelations(relations)
    const settlementDescription =
      settlement.population < 4
        ? 'small'
        : settlement.population > 8
          ? 'large'
          : 'medium-sized'

    if (['artillery', 'soldier', 'dragoon'].includes(unit.name)) {
      return {
        name: 'settlement.enter.military'
      }
    }

    // if (unit.name === 'artillery') {
    //   return {
    //     text: `Do you want to **bombard** the ${settlementDescription} settlement (${settlement.population})?<options/>`,
    //     type: 'marshal',
    //     options: [
    //       {
    //         text: 'Fire!',
    //         action: () => {
    //           Bombard(settlement, unit)
    //         },
    //       },
    //       {
    //         text: 'No, spare these people.',
    //       },
    //     ],
    //   }
    // }

    // if (unit.name === 'soldier' || unit.name === 'dragoon') {
    //   return {
    //     text: `Our soldiers are ready for orders close to the ${settlementDescription} native settlement (${settlement.population}).<options/>`,
    //     type: 'marshal',
    //     options: [
    //       {
    //         text: 'Attack settlement',
    //         action: () => {
    //           Attack(settlement, unit)
    //         },
    //       },
    //       {
    //         text: 'Demand food supplies',
    //         answer: 'food',
    //       },
    //       {
    //         text: 'Demand taxation',
    //         answer: 'tribute',
    //       },
    //       {
    //         text: 'Leave',
    //       },
    //     ],
    //   }
    // }

    if (relations.trust < 0.1 && relations.militancy > 0.5) {
      return {
        name: 'settlement.enter.refuse',
        context: {
          description
        }
      }
    }

    if (unit.name === 'scout') {
      return {
        name: 'settlement.enter.scout',
        context: {
          description,
          settlementDescription
        },
        answers: ['chief']
      }
    }
    if (unit.name === 'settler') {
      if (!unit.expert || unit.expert === 'servant') {
        if (relations.trust < 0 && relations.militancy > 0.5) {
          return {
            name: 'settlement.enter.vanished',
            context: {
              disband: () => {
                Unit.disband(unit)
              },              
            }
          }
        }
        if (relations.trust < 0 && relations.militancy > 0) {
          return {
            name: 'settlement.enter.insulted',
          }
        }
        if (settlement.hasLearned && relations.trust < 0.5) {
          return {
            name: 'settlement.enter.already_trained',
          }
        }

        const expert = experts[settlement.expert]
        return {
          name: 'settlement.enter.train',
          context: {
            expert
          },
          answers: ['live']
        }
      }
      if (unit.expert === 'criminal') {
        return {
          name: 'settlement.enter.criminal'
        }
      }
      if (unit.expert === settlement.expert) {
        return {
          name: 'settlement.enter.fellow_expert',
          context: {
            expert
          }
        }
        return {
          text: `Fare well fellow ${experts[settlement.expert]}. <options/>`,
          type: 'natives',
          image: settlement.tribe.image,
          options: [
            {
              text: 'Leave',
            },
          ],
        }
      }

      return {
        name: 'settlement.enter.other_expert'
      }
    }
    if (unit.name === 'missionary') {
      const description = Natives.describeRelations(relations)
      return {
        name: 'settlement.enter.missionary',
        context: {
          description
        },
        answers: ['mission']
      }
    }

    return {
      name: 'settlement.enter.default'
    }
  }
}

const listen = {
  mission: (settlement, fn) => Binding.listen(settlement, 'mission', fn),
}

const update = {
  mission: (settlement, value) => Binding.update(settlement, 'mission', value),
}

const save = settlement => ({
  mapCoordinates: settlement.mapCoordinates,
  tribe: Record.reference(settlement.tribe),
  owner: Record.reference(settlement.owner),
  expert: settlement.expert,
  presentGiven: settlement.presentGiven,
  hasLearned: settlement.hasLearned,
  mission: Record.reference(settlement.mission),
  population: settlement.population,
  lastTaxation: settlement.lastTaxation,
})

const load = settlement => {
  settlement.tribe = Record.dereference(settlement.tribe)
  settlement.owner = Record.dereference(settlement.owner)
  settlement.mission = Record.dereference(settlement.mission)

  Record.entitiesLoaded(() => initialize(settlement))
  return settlement
}

export default {
  create,
  disband,
  listen,
  update,
  load,
  save,
  dialog,
}
