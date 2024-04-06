import $ from 'signal-chain'
import type { ColonistEntity, StorageEntity } from './types'
import { UnitEntity } from 'ui/overlay/Unit'
import { Function1 } from 'util/types'

import Storage from 'entity/storage'

import ColonistData from 'data/colonists.json'
import GoodsData from 'data/goods.json'
import BuildingData from 'data/buildings.json'
import UnitsData from 'data/units.json'

const unitName = $.uniqueValue(
    $.select<UnitEntity>(),
    $.combine(
        $.listen.key('expert'),
        $.listen.key('properties'),
    ),
    $.select(([expert, properties]) => expert && properties.name[expert] || properties.name.default)
)

export const name = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.listen.key('unit'),
    unitName
)

export const profession = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.listen.key('work'),
    $.type.not.isNothing(
        $.select(work => {
            if (work.type === 'Building') {
                if (work.building.name === 'school') {
                    return 'teacher'
                }

                // @ts-expect-error impossible to teach typescript this lookup
                return GoodsData[BuildingData[work.building.name].production.good].expert as string
            }

            // @ts-expect-error lookup
            let currentProfession: string = GoodsData[work.good].expert
            if (currentProfession === 'farmer' && work.tile.domain === 'sea') {
                currentProfession = 'fisher'
            }

            return currentProfession
        })
    ),
    $.select(profession => profession ?? 'settler')
)

export const professionName = $.uniqueValue(
    // @ts-expect-error lookup
    $.select<string>(profession => UnitsData.settler.name[profession] as string || 'Settler')
)

export const expert = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.listen.key('unit'),
    $.listen.key('expert')
)


export const expertName = $.uniqueValue(
    expert,
    // @ts-expect-error lookup
    $.select(colonist => UnitsData.settler.name[colonist.unit.expert] as string || 'Settler')
)

export const power = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.combine(
        profession,
        $.listen.key('mood'),
        $.listen.key('power'),
        expert
    ),
    $.select(([profession, mood, power, expert]) => {
        return 10 * Math.max((
            mood +
            power +
            (expert === profession ? 1 : 0) +
            // @ts-expect-error lookup
            (ColonistData[profession] || ColonistData.default).power +
            // @ts-expect-error lookup
            (ColonistData[expert] || ColonistData.default).power
        ), 0)
    })
)

const storageListener = (selectStorage: Function1<ColonistEntity, StorageEntity>) => $.chain(
    $.select<ColonistEntity>(),
    $.type.not.isNothing(
        $.select(selectStorage),
        Storage.signal
    ),
    $.select<unknown, StorageEntity>(x => (x as StorageEntity) ?? {})
)

const roundQuantities = (obj: StorageEntity) => Object.fromEntries(
    Object.entries(obj)
        .map(([good, amount]) => ([good, Math.round(amount)]))
)

const filterPositive = (obj: StorageEntity) => Object.fromEntries(
    Object.entries(obj)
        .filter(([_, amount]) => amount > 0)
)
const filterNotZero = (obj: StorageEntity) => Object.fromEntries(
    Object.entries(obj)
        .filter(([_, amount]) => amount !== 0)
)
const invertQuantities = (obj: StorageEntity) => Object.fromEntries(
    Object.entries(obj)
        .map(([good, amount]) => ([good, -amount]))
)


export const productionOutput = $.uniqueValue(
    storageListener(colonist => colonist.productionSummary),
    $.select(roundQuantities),
    $.select(filterPositive),
)

export const productionInput = $.uniqueValue(
    storageListener(colonist => colonist.productionSummary),
    $.select(roundQuantities),
    $.select(invertQuantities),
    $.select(filterPositive)
)

export const positiveConsumption = $.uniqueValue(
    storageListener(colonist => colonist.consumptionSummary),
    $.select(roundQuantities),
    $.select(filterNotZero),
    $.select(invertQuantities),
)

export const storage = $.uniqueValue(
    storageListener(colonist => colonist.storage)
)

export const promotionProgress = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.maybe.listen.key('promotion'),
    $.select(promotion =>
        promotion?.target &&
        promotion?.progress &&
        promotion.progress[promotion.target]),
    $.select(progress => progress ? Math.floor(100 * progress) : 0)
)

const stateChain = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.maybe.listen.key('state')
)

export const state = {
    noWood: $.chain(stateChain, $.select(state => state?.noWood)),
    noFood: $.chain(stateChain, $.select(state => state?.noFood)),
    noLuxury: $.chain(stateChain, $.select(state => state?.noLuxury)),
    isPromoting: $.chain(stateChain, $.select(state => state?.isPromoting)),
    hasBonus: $.chain(stateChain, $.select(state => state?.hasBonus)),
}

const breakdownChain = $.uniqueValue(
    $.select<ColonistEntity>(),
    $.maybe.listen.key('consumptionBreakdown'),
    $.maybe.listen.key('has')
)

export const breakdown = {
    food: $.chain(breakdownChain, $.select(has => has?.food)),
    wood: $.chain(breakdownChain, $.select(has => has?.wood)),
    luxury: $.chain(breakdownChain, $.select(has => has?.luxury)),
    bonus: $.chain(breakdownChain, $.select(has => has?.bonus)),
    promotion: $.chain(breakdownChain, $.select(has => has?.promotion)),
}


export const canPromote = $.uniqueValue(
    $.combine(
        expert,
        profession
    ),
    $.select(([expert, profession]) => expert !== profession)
)

export const promotionTarget = $.uniqueValue(
    $.combine(
        expert,
        profession
    ),
    $.select(([expert, profession]) => {
        if (expert === 'servant') {
            return 'settler'
        }
        if (expert === 'criminal') {
            return 'servant'
        }

        return profession
    })
)

type ColonistDescription = {
    consumption: {
        luxury?: StorageEntity
        promotion?: StorageEntity
    }
}

export const needsForPromotion = $.uniqueValue(
    // @ts-expect-error lookup
    $.select<string, ColonistDescription>(promotionTarget => ColonistData[promotionTarget] || ColonistData.default),
    $.select(description => {
        const luxury = description?.consumption?.luxury
        const promotion = description?.consumption?.promotion

        return {
            ...luxury,
            ...promotion,
        }
    })
)
