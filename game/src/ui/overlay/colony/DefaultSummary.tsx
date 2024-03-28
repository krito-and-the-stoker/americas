import type { ColonyEntity } from 'entity/colony'
import { Show, For } from 'solid-js'

import Util from 'util/util'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Construction from 'entity/construction'

import Foreground from 'render/foreground'
import Signal from 'signal-chain-solid'
import Dialog from 'view/ui/dialog'
import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'

import styles from './DefaultSummary.module.scss'

function openConstructionDialog(colony: ColonyEntity) {
    const options = Construction.options(colony)

    const prepareOption = (option: any) => ({
        ...option,
        start: () => Construction.start(colony, option),
        percentage: Math.floor((100 * option.progress) / Util.sum(Object.values(option.cost))),
    })

    console.log(options)
    Dialog.open('colony.construction', {
        newBuildings: options.newBuildings.map(prepareOption),
        upgradeBuildings: options.upgradeBuildings.map(prepareOption),
        units: options.units.map(prepareOption),
        stop: () => Construction.start(colony, null)
    })
}

function DefaultSummary() {
    const colonyChain = Signal.chain(
        Foreground.listen.screen,
        Signal.select((screen: any) => screen?.params?.colony as ColonyEntity | undefined)
    )

    const colony = Signal.solid.create(
        colonyChain
    )

    const productionSummary = Signal.solid.create(
        colonyChain,
        Signal.select(colony => colony && colony.productionSummary),
        Storage.signal
    )

    const constructionChain = Signal.chain(
        colonyChain,
        Signal.assert.not.isNothing(
            Colony.chain.currentConstruction
        )
    )
    const cost = Signal.solid.create(
        constructionChain,
        Signal.select(construction => construction?.cost)
    )

    const progressPercentage = Signal.solid.create(
        constructionChain,
        Signal.select(construction => {
            const costSum = Util.sum(Object.values(construction?.cost ?? {})) || 1
            return 100 * (construction?.progress ?? 0) / costSum
        }),
        Signal.select(progress => Math.floor(progress))
    )

    const display = Signal.solid.create(
        constructionChain,
        Signal.select(construction => construction?.display)
    )

    const rebelNumber = Signal.solid.create(
        colonyChain,
        Signal.assert.not.isNothing(
            Colony.chain.rebels
        )
    )
    const rebelPercentage = Signal.solid.create(
        colonyChain,
        Signal.assert.not.isNothing(
            Colony.chain.rebelPercentage
        )
    )

    const toryNumber = Signal.solid.create(
        colonyChain,
        Signal.assert.not.isNothing(
            Colony.chain.tories
        )
    )

    const toryPercentage = Signal.solid.create(
        colonyChain,
        Signal.assert.not.isNothing(
            Colony.chain.toryPercentage
        )
    )

    const supportedUnits = Signal.solid.create(
        colonyChain,
        Signal.assert.not.isNothing(
            Signal.listen.key('supportedUnits'),
            Signal.each(
                Signal.combine(
                    Signal.select(),
                    Signal.chain(
                        Signal.listen.key('colonist'),
                        Signal.maybe.listen.key('colony'),
                        Signal.select(colony => !!colony)
                    ),
                    Signal.chain(
                        Signal.select(unit => unit?.consumptionSummary),
                        Storage.signal,
                        Signal.select(storage => (!!storage && Util.sum(Storage.goods(storage).map(pack => pack.amount))) || 0)
                    )
                ),
                Signal.select(([unit, hasColony, consumption]) => ({ unit, show: !hasColony && consumption < 0 })),
            ),
        ),
        Signal.select(entries => entries?.filter(entry => entry.show).map(entry => entry.unit) ?? [])
    )

    const hasConstructors = Signal.solid.create(
        colonyChain,
        Signal.assert.not.isNothing(
            Signal.listen.key('colonists'),
            Signal.each(
                Signal.listen.key('work')
            ),
        ),
        Signal.select(
            works => !!works && works.filter(
                work => work?.type === 'Building' && work.building?.name === 'carpenters'
            ).length > 0
        )
    )

    return <>
        <div class={styles.title}>Production and Consumption</div>
        <ProductionGoods goods={productionSummary()} sort={true} />
        <Show when={hasConstructors()}>
            <div class={styles.construction} onClick={() => openConstructionDialog(colony()!)}>
                <div class={styles.subtitle}>Construction</div>
                <Show when={display()} fallback={<i>None</i>}>
                    <span><i>{display()}</i></span>
                    <StorageGoods goods={cost()} />
                    <span>{progressPercentage()}%</span>
                </Show>
            </div>
        </Show>
        <div class={styles.colonists}>
            <div classList={{[styles.green]: rebelPercentage()! >= 50}}>
                <i>Integrated</i> {rebelPercentage()}% ({rebelNumber()} Colonists)
            </div>
            <div classList={{[styles.red]: toryNumber()! >= 10}}>
                <i>Unorganized</i> {toryPercentage()}% ({toryNumber()} Colonists)
            </div>
        </div>
        <Show when={supportedUnits()?.length > 0}>
            <div class={styles.supportTitle}>Supported Units</div>
            <div class={styles.supported}>
                <For each={supportedUnits()!}>
                    {unit => <GameIcon unit={unit} />}
                </For>
            </div>
        </Show>
    </>
}

export default DefaultSummary