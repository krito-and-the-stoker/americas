import $ from 'signal-chain-solid'

import styles from './Colonist.module.scss'
import GameIcon from 'ui/components/GameIcon'
import { Show } from 'solid-js'
import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import { ColonistEntity, StorageEntity } from 'entity/colonist/types'

import Colonist from 'entity/colonist'


function ColonistDetail(colonistEntity: ColonistEntity) {
    const colonist = $.emit(colonistEntity)
    const name = $.solid.create(colonist, Colonist.chain.name)

    const power = $.solid.create(
        colonist,
        Colonist.chain.power,
        $.select(power => power.toFixed(0))
    )

    const promotionTarget = $.solid.create(
        colonist,
        Colonist.chain.promotionTarget,
        Colonist.chain.professionName
    )

    const canPromote = $.solid.create(
        colonist,
        Colonist.chain.canPromote
    )

    const state = {
        noWood: $.solid.create(colonist, Colonist.chain.state.noWood),
        noFood: $.solid.create(colonist, Colonist.chain.state.noFood),
        noLuxury: $.solid.create(colonist, Colonist.chain.state.noLuxury),
        isPromoting: $.solid.create(colonist, Colonist.chain.state.isPromoting),
        hasBonus: $.solid.create(colonist, Colonist.chain.state.hasBonus),
    }

    const breakdown = {
        food: $.solid.create(colonist, Colonist.chain.breakdown.food),
        wood: $.solid.create(colonist, Colonist.chain.breakdown.wood),
        luxury: $.solid.create(colonist, Colonist.chain.breakdown.luxury),
        bonus: $.solid.create(colonist, Colonist.chain.breakdown.bonus),
        promotion: $.solid.create(colonist, Colonist.chain.breakdown.promotion),
    }

    const promotionProgress = $.solid.create(colonist, Colonist.chain.promotionProgress)

    const hasEntries = (obj: StorageEntity | undefined) => obj && Object.keys(obj).length > 0
    const hasNonzeroEntries = (obj: StorageEntity | undefined) => hasEntries(obj) && Object.values(obj!).some(value => value !== 0)

    const productionOutput = $.solid.create(colonist, Colonist.chain.productionOutput)
    const productionInput = $.solid.create(colonist, Colonist.chain.productionInput)
    const positiveConsumption = $.solid.create(colonist, Colonist.chain.positiveConsumption)
    const storage = $.solid.create(colonist, Colonist.chain.storage)
    const workType = $.chain(
        colonist,
        Colonist.chain.workType,
        $.log('workType')
    )
    const noFoodDescription = $.solid.create(
        workType,
        $.maybe.select(type => type === 'Building' ? '-33%' : '-50%'),
        $.maybe.select(percentage => `${percentage} production`)
    )

    return <>
        <div class={styles.title}>{name()}</div>
        <div class={styles.colonist}>
            <div class={styles.icon}><GameIcon unit={colonistEntity.unit} scale={2} /></div>
            <div class={styles.state}>
                <div class={styles.power}>Power {power()}</div>
                <Show when={hasEntries(breakdown.food())}><div class={styles.stateTag}>
                    <span classList={{ [styles.has]: !state.noFood(), [styles.missing]: state.noFood() }}>Food</span>
                    <Show when={breakdown.food()}><ProductionGoods scale={0.5} goods={breakdown.food()} /></Show>
                    <Show when={state.noFood()}><span class={styles.explanation}>({noFoodDescription()})</span></Show>
                </div></Show>
                <Show when={hasEntries(breakdown.wood())}><div class={styles.stateTag}>
                    <span classList={{ [styles.has]: !state.noWood(), [styles.missing]: state.noWood() }}>Wood</span>
                    <Show when={breakdown.wood()}><ProductionGoods scale={0.5} goods={breakdown.wood()} /></Show>
                    <Show when={state.noWood()}><span class={styles.explanation}>(-2 Production)</span></Show>
                </div></Show>
                <Show when={hasEntries(breakdown.luxury())}><div class={styles.stateTag} classList={{ [styles.inactive]: state.noLuxury()}}>
                    <span classList={{ [styles.has]: !state.noLuxury(), [styles.missing]: state.noLuxury() }}>Expert</span>
                    <Show when={breakdown.luxury()}><ProductionGoods scale={0.5} goods={breakdown.luxury()} /></Show>
                    <Show when={state.noLuxury()}><span class={styles.explanation}>No Expert bonus</span></Show>
                </div></Show>
                <Show when={canPromote() && hasEntries(breakdown.promotion())}><div class={styles.stateTag} classList={{ [styles.inactive]: !state.isPromoting() }}>
                    <span classList={{ [styles.has]: state.isPromoting() }}>Promoting {promotionProgress()}%</span>
                    <Show when={breakdown.promotion()}><ProductionGoods scale={0.5} goods={breakdown.promotion()} /></Show>
                    <span>&nbsp;-&gt; {promotionTarget()}</span>
                </div></Show>
                <Show when={hasEntries(breakdown.bonus())}><div class={styles.stateTag} classList={{ [styles.inactive]: !state.hasBonus() }}>
                    <span classList={{ [styles.has]: state.hasBonus() }}>Bonus</span>
                    <Show when={breakdown.bonus()}><ProductionGoods scale={0.5} goods={breakdown.bonus()} /></Show>
                    <Show when={state.hasBonus()}><span class={styles.explanation}>(+2 Production)</span></Show>
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

export default ColonistDetail
