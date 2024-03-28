import type { Function1 } from 'util/types'
import type { BuildingEntity } from 'view/colony/buildings'
import type { UnitEntity } from '../Unit'
import type { ColonyEntity } from 'entity/colony'

import { Show } from 'solid-js'

import $ from 'signal-chain-solid'

import Storage from 'entity/storage'
import Colonist from 'entity/colonist'
import Unit from 'entity/unit'

import Hover from 'input/hover'

import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'
import styles from './ColonistSummary.module.scss'


type StorageEntity = {
    [key: string]: number
}

type ColonistWork = {
    type: 'Building'
    building: BuildingEntity
}

type BreakdownObject<T> = {
    food: T
    wood: T
    luxury: T
    bonus: T
    promotion: T
}

type ConsumptionBreakdown = {
    has: BreakdownObject<StorageEntity>,
    want: BreakdownObject<StorageEntity>,
    state: BreakdownObject<boolean>
}

export type ColonistEntity = {
    work?: ColonistWork
    unit: UnitEntity
    storage: StorageEntity
    colony?: ColonyEntity
    consumptionSummary: StorageEntity
    productionSummary: StorageEntity
    consumptionRecord: StorageEntity
    state: {
        noFood: boolean
        noWood: boolean
        noLuxury: boolean
        isPromoting: boolean
        hasBonus: boolean
    },
    consumptionBreakdown: ConsumptionBreakdown
    promotion: {
        target: string
        progress: {
            [key: string]: number
        }
    }
}

type HoverData = {
    colonist?: ColonistEntity
}

function ColonistSummary() {
    const colonistChain = $.chain(
        Hover.listen.data,
        $.select((data: HoverData) => data?.colonist)
    )
    const colonist = $.solid.create(colonistChain)

    const unitChain = $.chain(
        colonistChain,
        $.maybe.listen.key('unit')
    )
    const unit = $.solid.create(unitChain)

    const propertyChain = $.chain(
        colonistChain,
        $.maybe.listen.key('unit'),
        $.maybe.listen.key('properties')
    )

    const name = $.solid.create(
        $.combine(
            unitChain,
            propertyChain,
        ),
        $.select(([unit]) => unit && Unit.name(unit) as string)
    )

    const storageListener = (selectStorage: Function1<ColonistEntity, StorageEntity>) => $.chain(
        colonistChain,
        $.assert.not.isNothing(
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


    const productionOutput = $.solid.create(
        storageListener(colonist => colonist.productionSummary),
        $.select(roundQuantities),
        $.select(filterPositive),
    )

    const productionInput = $.solid.create(
        storageListener(colonist => colonist.productionSummary),
        $.select(roundQuantities),
        $.select(invertQuantities),
        $.select(filterPositive)
    )

    const positiveConsumption = $.solid.create(
        storageListener(colonist => colonist.consumptionSummary),
        $.select(roundQuantities),
        $.select(filterNotZero),
        $.select(invertQuantities),
    )

    const storage = $.solid.create(
        storageListener(colonist => colonist.storage)
    )

    const stateChain = $.chain(
        colonistChain,
        $.maybe.listen.key('state')
    )

    const state = {
        noWood: $.solid.create(stateChain, $.select(state => state?.noWood)),
        noFood: $.solid.create(stateChain, $.select(state => state?.noFood)),
        noLuxury: $.solid.create(stateChain, $.select(state => state?.noLuxury)),
        isPromoting: $.solid.create(stateChain, $.select(state => state?.isPromoting)),
        hasBonus: $.solid.create(stateChain, $.select(state => state?.hasBonus)),
    }

    const breakdownChain = $.chain(
        colonistChain,
        $.maybe.listen.key('consumptionBreakdown'),
        $.maybe.listen.key('has')
    )

    const breakdown = {
        food: $.solid.create(breakdownChain, $.select(has => has?.food)),
        wood: $.solid.create(breakdownChain, $.select(has => has?.wood)),
        luxury: $.solid.create(breakdownChain, $.select(has => has?.luxury)),
        bonus: $.solid.create(breakdownChain, $.select(has => has?.bonus)),
        promotion: $.solid.create(breakdownChain, $.select(has => has?.promotion)),
    }

    const promotionProgress = $.solid.create(
        colonistChain,
        $.maybe.listen.key('promotion'),
        $.select(promotion =>
            promotion?.target &&
            promotion?.progress &&
            promotion.progress[promotion.target]),
        $.select(progress => progress ? Math.floor(100 * progress) : 0)
    )


    const hasEntries = (obj: StorageEntity) => obj && Object.keys(obj).length > 0


    return <>
        <div class={styles.title}>{name()}</div>
        <div class={styles.colonist}>
            <div class={styles.icon}><GameIcon unit={unit()} scale={2} /></div>
            <div class={styles.state}>
                <div class={styles.power}>Power {Math.round(10 * Colonist.power(colonist()))}</div>
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

export default ColonistSummary
