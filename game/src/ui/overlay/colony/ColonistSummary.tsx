import type { Function1 } from 'util/types'
import type { BuildingEntity } from 'view/colony/buildings'
import type { UnitEntity } from '../Unit'
import type { ColonyEntity } from 'entity/colony'

import { Show } from 'solid-js'

import Signal from 'util/signal-ts'

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
    const colonistChain = Signal.chain(
        Hover.listen.data,
        Signal.select((data: HoverData) => data?.colonist)
    )
    const colonist = Signal.createSolid(colonistChain)

    const unitChain = Signal.chain(
        colonistChain,
        Signal.maybe.key('unit')
    )
    const unit = Signal.createSolid(unitChain)

    const propertyChain = Signal.chain(
        colonistChain,
        Signal.maybe.key('unit'),
        Signal.maybe.key('properties')
    )

    const name = Signal.createSolid(
        Signal.combine(
            unitChain,
            propertyChain,
        ),
        Signal.select(([unit]) => unit && Unit.name(unit) as string)
    )

    const storageListener = (selectStorage: Function1<ColonistEntity, StorageEntity>) => Signal.chain(
        colonistChain,
        Signal.assert.not.isNothing(
            Signal.select(selectStorage),
            Storage.signal
        ),
        Signal.select<unknown, StorageEntity>(x => (x as StorageEntity) ?? {})
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


    const productionOutput = Signal.createSolid(
        storageListener(colonist => colonist.productionSummary),
        Signal.select(roundQuantities),
        Signal.select(filterPositive),
    )

    const productionInput = Signal.createSolid(
        storageListener(colonist => colonist.productionSummary),
        Signal.select(roundQuantities),
        Signal.select(invertQuantities),
        Signal.select(filterPositive)
    )

    const positiveConsumption = Signal.createSolid(
        storageListener(colonist => colonist.consumptionSummary),
        Signal.select(roundQuantities),
        Signal.select(filterNotZero),
        Signal.select(invertQuantities),
    )

    const storage = Signal.createSolid(
        storageListener(colonist => colonist.storage)
    )

    const stateChain = Signal.chain(
        colonistChain,
        Signal.maybe.key('state')
    )

    const state = {
        noWood: Signal.createSolid(stateChain, Signal.select(state => state?.noWood)),
        noFood: Signal.createSolid(stateChain, Signal.select(state => state?.noFood)),
        noLuxury: Signal.createSolid(stateChain, Signal.select(state => state?.noLuxury)),
        isPromoting: Signal.createSolid(stateChain, Signal.select(state => state?.isPromoting)),
        hasBonus: Signal.createSolid(stateChain, Signal.select(state => state?.hasBonus)),
    }

    const breakdownChain = Signal.chain(
        colonistChain,
        Signal.maybe.key('consumptionBreakdown'),
        Signal.maybe.key('has')
    )

    const breakdown = {
        food: Signal.createSolid(breakdownChain, Signal.select(has => has?.food)),
        wood: Signal.createSolid(breakdownChain, Signal.select(has => has?.wood)),
        luxury: Signal.createSolid(breakdownChain, Signal.select(has => has?.luxury)),
        bonus: Signal.createSolid(breakdownChain, Signal.select(has => has?.bonus)),
        promotion: Signal.createSolid(breakdownChain, Signal.select(has => has?.promotion)),
    }

    const promotionProgress = Signal.createSolid(
        colonistChain,
        Signal.maybe.key('promotion'),
        Signal.select(promotion =>
            promotion?.target &&
            promotion?.progress &&
            promotion.progress[promotion.target]),
        Signal.select(progress => progress ? Math.floor(100 * progress) : 0)
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
