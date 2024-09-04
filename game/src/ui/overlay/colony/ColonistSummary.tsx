import type { ColonistEntity, StorageEntity } from 'entity/colonist/types'

import { Show } from 'solid-js'

import $ from 'signal-chain-solid'

import Colonist from 'entity/colonist'

import Hover from 'input/hover'

import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'
import styles from './ColonistSummary.module.scss'


type HoverData = {
    colonist?: ColonistEntity
}

function ColonistSummary() {
    const colonist = $.chain(
        Hover.listen.data,
        $.select((data: HoverData) => data?.colonist)
    )

    const unit = $.solid.create(
        colonist,
        $.maybe.listen.key('unit')
    )

    const name = $.solid.create(colonist, $.maybe.chain(Colonist.chain.name))

    const power = $.solid.create(
        colonist,
        $.maybe.chain(
            Colonist.chain.power,
            $.select(power => power.toFixed(0)),
        ),
    )

    const state = {
        noWood: $.solid.create(colonist, $.maybe.chain(Colonist.chain.state.noWood)),
        noFood: $.solid.create(colonist, $.maybe.chain(Colonist.chain.state.noFood)),
        noLuxury: $.solid.create(colonist, $.maybe.chain(Colonist.chain.state.noLuxury)),
        isPromoting: $.solid.create(colonist, $.maybe.chain(Colonist.chain.state.isPromoting)),
        hasBonus: $.solid.create(colonist, $.maybe.chain(Colonist.chain.state.hasBonus)),
    }

    const breakdown = {
        food: $.solid.create(colonist, $.maybe.chain(Colonist.chain.breakdown.food)),
        wood: $.solid.create(colonist, $.maybe.chain(Colonist.chain.breakdown.wood)),
        luxury: $.solid.create(colonist, $.maybe.chain(Colonist.chain.breakdown.luxury)),
        bonus: $.solid.create(colonist, $.maybe.chain(Colonist.chain.breakdown.bonus)),
        promotion: $.solid.create(colonist, $.maybe.chain(Colonist.chain.breakdown.promotion)),
    }

    const promotionProgress = $.solid.create(colonist, $.maybe.chain(Colonist.chain.promotionProgress))

    const hasEntries = (obj: StorageEntity | undefined) => obj && Object.keys(obj).length > 0
    const hasNonzeroEntries = (obj: StorageEntity | undefined) => hasEntries(obj) && Object.values(obj!).some(value => value !== 0)

    const productionOutput = $.solid.create(colonist, $.maybe.chain(Colonist.chain.productionOutput))
    const productionInput = $.solid.create(colonist, $.maybe.chain(Colonist.chain.productionInput))
    const positiveConsumption = $.solid.create(colonist, $.maybe.chain(Colonist.chain.positiveConsumption))
    const storage = $.solid.create(colonist, $.maybe.chain(Colonist.chain.storage))


    return <>
        <div class={styles.title}>{name()}</div>
        <div class={styles.colonist}>
            <div class={styles.icon}><GameIcon unit={unit()} scale={2} /></div>
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
                    <span>No Expert</span>
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
        <Show when={hasEntries(productionOutput())} fallback={<div class={styles.subtitle}>No Production</div>}>
            <div class={styles.subtitle}>{hasEntries(productionInput()) ? 'Manufacturing' : 'Production'}</div>
            <div class={styles.production}>
                <ProductionGoods goods={productionInput()} />
                <Show when={hasEntries(productionInput())}><span class={styles.arrow}>into</span></Show>
                <ProductionGoods goods={productionOutput()} />
            </div>
        </Show>
        <Show when={hasEntries(positiveConsumption())}>
            <div class={styles.subtitle}>Consumption</div>
            <div class={styles.consumption}>
                <ProductionGoods goods={positiveConsumption()} />
            </div>
        </Show>
        <Show when={hasNonzeroEntries(storage())}>
            <div class={styles.subtitle}>Personal Reserve</div>
            <div class={styles.backup}>
                <StorageGoods goods={storage()} />
            </div>
        </Show>
    </>
}

export default ColonistSummary
