import $ from 'signal-chain-solid'

import ColonistData from 'data/colonists.json'
import GoodsData from 'data/goods.json'
import BuildingData from 'data/buildings.json'

import Storage from 'entity/storage'

import type { ColonistEntity, StorageEntity } from "ui/overlay/colony/ColonistSummary"

import styles from './Colonist.module.scss'
import { UnitEntity } from 'ui/overlay/Unit'
import GameIcon from 'ui/components/GameIcon'
import { Function1 } from 'util/types'
import { Show } from 'solid-js'
import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'


namespace Unit {
    export const name = $.chain(
        $.select<UnitEntity>(),
        $.combine(
            $.listen.key('expert'),
            $.listen.key('properties'),
        ),
        $.select(([expert, properties]) => expert && properties.name[expert] || properties.name.default)
    )
}

namespace Colonist {
    export const name = $.chain(
        $.select<ColonistEntity>(),
        $.listen.key('unit'),
        Unit.name
    )

    export const profession = $.chain(
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

    export const expert = $.chain(
        $.select<ColonistEntity>(),
        $.listen.key('unit'),
        $.listen.key('expert')
    )

    export const power = $.chain(
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


    export const productionOutput = $.chain(
        storageListener(colonist => colonist.productionSummary),
        $.select(roundQuantities),
        $.select(filterPositive),
    )

    export const productionInput = $.chain(
        storageListener(colonist => colonist.productionSummary),
        $.select(roundQuantities),
        $.select(invertQuantities),
        $.select(filterPositive)
    )

    export const positiveConsumption = $.chain(
        storageListener(colonist => colonist.consumptionSummary),
        $.select(roundQuantities),
        $.select(filterNotZero),
        $.select(invertQuantities),
    )

    export const storage = $.chain(
        storageListener(colonist => colonist.storage)
    )

    export const promotionProgress = $.chain(
        $.select<ColonistEntity>(),
        $.maybe.listen.key('promotion'),
        $.select(promotion =>
            promotion?.target &&
            promotion?.progress &&
            promotion.progress[promotion.target]),
        $.select(progress => progress ? Math.floor(100 * progress) : 0)
    )

    const stateChain = $.chain(
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

    const breakdownChain = $.chain(
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
}


function ColonistDetail(colonistEntity: ColonistEntity) {
    const colonist = $.emit(colonistEntity)
    const name = $.solid.create(colonist, Colonist.name)

    const power = $.solid.create(
        colonist,
        Colonist.power,
        $.select(power => power.toFixed(0))
    )

    const state = {
        noWood: $.solid.create(colonist, Colonist.state.noWood),
        noFood: $.solid.create(colonist, Colonist.state.noFood),
        noLuxury: $.solid.create(colonist, Colonist.state.noLuxury),
        isPromoting: $.solid.create(colonist, Colonist.state.isPromoting),
        hasBonus: $.solid.create(colonist, Colonist.state.hasBonus),
    }

    const breakdown = {
        food: $.solid.create(colonist, Colonist.breakdown.food),
        wood: $.solid.create(colonist, Colonist.breakdown.wood),
        luxury: $.solid.create(colonist, Colonist.breakdown.luxury),
        bonus: $.solid.create(colonist, Colonist.breakdown.bonus),
        promotion: $.solid.create(colonist, Colonist.breakdown.promotion),
    }

    const promotionProgress = $.solid.create(colonist, Colonist.promotionProgress)

    const hasEntries = (obj: StorageEntity) => Object.keys(obj).length > 0

    const productionOutput = $.solid.create(colonist, Colonist.productionOutput)
    const productionInput = $.solid.create(colonist, Colonist.productionInput)
    const positiveConsumption = $.solid.create(colonist, Colonist.positiveConsumption)
    const storage = $.solid.create(colonist, Colonist.storage)

    return <>
        <div class={styles.title}>{name()}</div>
        <div class={styles.colonist}>
            <div class={styles.icon}><GameIcon unit={colonistEntity.unit} scale={2} /></div>
            <div class={styles.state}>
                <div class={styles.power}>Power {power()}</div>
                <Show when={state.noFood()}><div class={styles.stateTag}>
                    <span>No Food</span>
                    <Show when={breakdown.food()}><ProductionGoods scale={0.5} goods={breakdown.food()} /></Show>
                </div></Show>
                <Show when={state.noWood()}><div class={styles.stateTag}>
                    <span>No Wood</span>
                    <Show when={breakdown.wood()}><ProductionGoods scale={0.5} goods={breakdown.wood()} /></Show>
                </div></Show>
                <Show when={state.noLuxury()}><div class={styles.stateTag}>
                    <span>No Luxury</span>
                    <Show when={breakdown.luxury()}><ProductionGoods scale={0.5} goods={breakdown.luxury()} /></Show>
                </div></Show>
                <Show when={state.isPromoting()}><div class={styles.stateTag}>
                    <span>Promoting {promotionProgress()}%</span>
                    <Show when={breakdown.promotion()}><ProductionGoods scale={0.5} goods={breakdown.promotion()} /></Show>
                </div></Show>
                <Show when={state.hasBonus()}><div class={styles.stateTag}>
                    <span>Bonus</span>
                    <Show when={breakdown.bonus()}><ProductionGoods scale={0.5} goods={breakdown.bonus()} /></Show>
                </div></Show>
            </div>
        </div>
        <Show when={hasEntries(productionOutput())}>
            <div class={styles.subtitle}>{hasEntries(productionInput()) ? 'Manufacturing' : 'Production'}</div>
            <div class={styles.production}>
                <ProductionGoods goods={productionInput()} />
                <Show when={hasEntries(productionInput())}><span class={styles.arrow}>into</span></Show>
                <ProductionGoods goods={productionOutput()} />
            </div>
        </Show>
        <Show when={hasEntries(positiveConsumption())} fallback={<div class={styles.subtitle}>No Consumption</div>}>
            <div class={styles.subtitle}>Consumption</div>
            <div class={styles.consumption}>
                <ProductionGoods goods={positiveConsumption()} />
            </div>
        </Show>
        <div class={styles.subtitle}>Personal Reserve</div>
        <div class={styles.backup}>
            <StorageGoods goods={storage()} />
        </div>
    </>
}

export default ColonistDetail
